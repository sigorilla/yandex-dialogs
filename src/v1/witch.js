const Alice = require('yandex-dialogs-sdk');
const {itemsListCard} = require('yandex-dialogs-sdk/dist/card');
const logger = require('../lib/logger');
const Witch = require('../lib/providers/witch');

const {button, reply} = Alice;
const alice = new Alice();

const createReply = (retryText, options = {}) => reply({
    text: retryText ?
        retryText + ' Начнем заново?' :
        'Привет! Я всезнающая Ведьма!\n\nЗадумайте реального или вымышленного персонажа, а я попытаюсь угадать его.',
    buttons: [
        button({
            title: 'Давай попробуем!',
            payload: {renew: Boolean(retryText)}
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
    ctx.reply(createReply('Хорошо!', {endSession: true}));
});

alice.any(async (ctx) => {
    logger.info(`payload = ${JSON.stringify(ctx.payload)}`);
    const {answerId, renew, exclusion, stop} = ctx.payload || {};
    if (stop) {
        return;
    }

    const witch = ctx.state.witch = ctx.state.witch || new Witch();

    let params;
    try {
        params = await witch.answer(answerId, {exclusion});
    } catch (err) {
        logger.error(`game error ${err}`);
        ctx.reply(createReply('Произошла ошибка!'));
        return;
    }

    const {question, answers, error, result} = params || {};

    if (error) {
        ctx.reply(createReply('Произошла ошибка!'));
        return;
    }

    if (result && result.name) {
        ctx.reply(reply({
            text: `Вы загадали "${result.name}"?`,
            buttons: [
                button({
                    title: 'Да!',
                    payload: {renew: true}
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

    const text = (renew ? 'Начинаем заново!\n\n' : '') + question;
    ctx.reply(reply({
        text,
        card: itemsListCard({
            header: {
                title: text
            },
            items: answers.map(({id, text}) => ({
                title: text,
                description: '',
                button: button({
                    title: text,
                    payload: {answerId: id}
                })
            }))
        }),
        buttons: witch.step > 0 ? [
            button({
                title: '⬅️  Исправить',
                payload: {id: -1}
            })
        ] : []
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
