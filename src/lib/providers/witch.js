const got = require('got');
const logger = require('../logger');
const {witch} = require('../config');

class Witch {
    constructor() {
        this._step = 0;
        this._session = undefined;
        this._signature = undefined;
    }

    request(path, params) {
        logger.info(`GET ${path} => ${JSON.stringify(params)}`);
        return got(`${witch.host}:${witch.port}/ws${path}`, {
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

            this._session = identification.session;
            this._signature = identification.signature;

            return this.extractAnswers(step_information);
        });
    }

    answer(answerId, {exclusion} = {}) {
        if (!this.isStarted()) {
            logger.warn('answer: starting new session');
            return this.start();
        }

        const params = {
            session: this._session,
            signature: this._signature,
            step: this._step
        };
        if (exclusion) {
            params.forward_answer = -1;
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
            this._step = step;

            if (progression > 97) {
                return this.getResult();
            }

            return this.extractAnswers(parameters);
        });
    }

    getResult() {
        if (!this.isStarted()) {
            logger.warn('get result: starting new session');
            return this.start();
        }

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
            answers: [
                ...answers.map(({answer}, index) => ({
                    id: index,
                    text: answer
                })),
                ...(this._step > 0 ? [{id: -1, text: '⬅️  Исправить'}] : [])
            ]
        };
    }
}

module.exports = Witch;
