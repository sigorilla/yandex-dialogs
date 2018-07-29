const got = require('got');
const logger = require('../logger');
const {witch: config} = require('../config');

class Witch {
    constructor() {
        this._step = 0;
        this._stepOfLastResult = this._step;
        this._progression = 0;
        this._session = undefined;
        this._signature = undefined;
    }

    get step() {
        return this._step;
    }

    request(path, params) {
        logger.info(`GET ${path} => ${JSON.stringify(params)}`);
        return got(`${config.host}:${config.port}/ws${path}`, {
            query: params,
            json: true
        }).then((response) => {
            logger.info(`GET ${path} => ${JSON.stringify(params)} => ${JSON.stringify(response.body)}`);
            return response;
        });
    }

    isStarted() {
        return Boolean(this._session && this._signature);
    }

    start() {
        return this.request('/new_session', {
            partner: 1,
            player: 'website-desktop',
            constraint: ''
        }).then(({body}) => {
            const {completion, parameters} = body;
            if (completion !== 'OK') {
                return {error: completion};
            }

            const {identification, step_information} = parameters;

            this._step = 0;
            this._stepOfLastResult = this._step;
            this._progression = 0;

            this._session = identification.session;
            this._signature = identification.signature;

            return this.extractAnswers(step_information);
        });
    }

    answer(answerId, {restart, exclusion} = {}) {
        if (!this.isStarted() || restart) {
            logger.warn('answer: starting new session');
            return this.start();
        }

        const params = {
            session: this._session,
            signature: this._signature,
            step: this._step
        };
        if (exclusion) {
            params.forward_answer = 1;
        } else {
            params.answer = answerId;
        }

        const path = exclusion ?
            '/exclusion' :
            answerId === -1 ? '/cancel_answer' : '/answer';

        return this.request(path, params).then(({body}) => {
            const {completion, parameters} = body;
            if (completion !== 'OK') {
                return {error: completion};
            }

            const {step, progression} = parameters;
            this._step = Number(step);
            this._progression = Number(progression);

            if (this.shouldShowResult()) {
                return this.getResult();
            }

            return this.extractAnswers(parameters);
        });
    }

    shouldShowResult() {
        if (this._step === config.consts.maxQuestions) {
            return true;
        } else if (this._step - this._stepOfLastResult < config.consts.maxQuestionsFromExclusion) {
            return false;
        } else if (
            this._progression > config.consts.maxProgression ||
            this._step - this._stepOfLastResult === config.consts.maxQuestionsFromResult
        ) {
            return this._step !== 75;
        } else {
            return false;
        }
    }

    getResult() {
        if (!this.isStarted()) {
            logger.warn('get result: starting new session');
            return this.start();
        }

        this._stepOfLastResult = this._step;
        return this.request('/list', {
            session: this._session,
            signature: this._signature,
            step: this._step,
            size: 2,
            max_pic_width: 250,
            max_pic_height: 250,
            pref_photos: 'VO-OK',
            mode_question: '0'
        }).then(({body}) => {
            const {completion, parameters} = body;
            if (completion !== 'OK') {
                return {error: completion};
            }

            return {
                result: parameters.elements[0].element
            };
        });
    }

    exclusion() {
        return this.request('/exclusion', {
            session: this._session,
            signature: this._signature,
            step: this._step,
            forward_answer: 1
        });
    }

    extractAnswers(parameters) {
        const {question, answers} = parameters;
        return {
            question,
            answers: answers.map(({answer}, index) => ({
                id: index,
                text: answer
            }))
        };
    }
}

module.exports = Witch;
