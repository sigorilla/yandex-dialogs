const Alice = require('yandex-dialogs-sdk');
const logger = require('../lib/logger');
const Witch = require('../lib/providers/witch');

const {button, reply} = Alice;
const alice = new Alice();

const createReply = (retry, options = {}) => reply({
    text: retry ?
        retry + ' Начнем заново?' :
        'Привет! Я всезнающая Ведьма!\n\nЗадумайте реального или вымышленного персонажа, а я попытаюсь угадать его.',
    buttons: [button('Давай попробуем!'), button('Не хочу')],
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

    const witch = ctx.state.witch = ctx.state.witch || new Witch();
    const {id} = ctx.payload || {};

    let params;
    try {
        params = await witch.answer(id);
    } catch (err) {
        logger.error(`${id ? 'answer' : 'start'} game error ${err}`);
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
            text: `Вы загадали ${result.name}?`,
            // TODO: cancel_answer
            buttons: [button('Да!'), button('Начать заново!')],
            endSession: true
        }));
        return;
    }

    // TODO: change answer
    ctx.reply(reply({
        text: question,
        buttons: answers.map(({id, text}) => button({
            title: text,
            payload: {id}
        }))
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
