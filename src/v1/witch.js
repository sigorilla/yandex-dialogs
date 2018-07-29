const Alice = require('yandex-dialogs-sdk');
const {itemsListCard} = require('yandex-dialogs-sdk/dist/card');
const localeMiddleware = require('../middlewares/locale');
const logger = require('../lib/logger');
const Witch = require('../lib/providers/witch');

const {button, reply} = Alice;
const alice = new Alice();

alice.use(localeMiddleware('witch'));

const createReply = (retryText, options = {}) => reply({
    text: retryText ?
        retryText + ' Начнем заново?' :
        'Привет! Я всезнающая Ведьма!\n\nЗадумайте реального или вымышленного персонажа, а я попытаюсь угадать его.',
    buttons: [
        button({
            title: 'Давай попробуем!',
            payload: {restart: Boolean(retryText)}
        }),
        button({
            title: 'Не хочу',
            payload: {stop: true}
        })
    ],
    ...options
});

alice.welcome((ctx) => {
    ctx.reply(createReply());
});

alice.command('Не хочу', (ctx) => {
    ctx.reply(createReply(ctx.i18n.t('ok'), {endSession: true}));
});

// TODO: add matcher for answers without `answerId`.

alice.any(async (ctx) => {
    const {payload, state, i18n} = ctx;

    logger.info(`payload = ${JSON.stringify(payload)}`);
    const {answerId, restart, exclusion, stop} = payload || {};
    if (stop) {
        ctx.reply(createReply(i18n.t('ok'), {endSession: true}));
        return;
    }

    const witch = state.witch = state.witch || new Witch(i18n.language);

    let params;
    try {
        params = await witch.answer(answerId, {restart, exclusion});
    } catch (err) {
        logger.error(`game error ${err}`);
        ctx.reply(createReply(i18n.t('error')));
        return;
    }

    const {question, answers, error, result} = params || {};

    if (error) {
        ctx.reply(createReply(i18n.t('error')));
        return;
    }

    if (result && result.name) {
        ctx.reply(reply({
            text: `Вы загадали "${result.name}"?`,
            buttons: [
                button({
                    title: 'Да!',
                    payload: {restart: true}
                }),
                button({
                    title: 'Нет...',
                    payload: {exclusion: true}
                })
            ],
            endSession: true
        }));
        return;
    }

    const text = `${witch.step + 1}. ${question}`;
    const isFirstStep = witch.step === 0;
    ctx.reply(reply({
        text: (restart ? 'Начинаем заново!\n\n' : '') + text,
        card: itemsListCard({
            header: {text},
            items: answers.map(({id, text}) => ({
                title: text,
                description: '',
                button: {
                    text,
                    payload: {answerId: id}
                }
            })),
            footer: !isFirstStep ?
                {
                    text: '⬅️  Исправить',
                    button: {
                        payload: {answerId: -1}
                    }
                } :
                undefined
        })
    }));
});

module.exports = (req, res, next) => {
    let responseAlreadySent = false;
    alice.handleRequest(req.body, (data) => {
        if (responseAlreadySent) {
            return false;
        }

        res.send(data);
        responseAlreadySent = true;
    }).catch(next);
};
