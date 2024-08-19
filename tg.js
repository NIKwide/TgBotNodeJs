const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Укажите ваш токен
const bot = new TelegramBot('', { polling: true });

console.log('Запущен бот');

// Обработчик обновлений
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    try {
        if (msg.text === '/start') {
            const userName = msg.from.first_name;
            await sendStartMessage(chatId, userName);
        } else if (msg.contact) {
            const phoneNumber = msg.contact.phone_number.replace('+', '');
            const userId = msg.contact.user_id.toString();
            console.log(`Отправка контакта: ${phoneNumber}; Имя: ${msg.from.first_name}`);
            await savePhoneNumberToDatabase(phoneNumber, userId, chatId);
        }
    } catch (error) {
        console.error(`Ошибка при обработке сообщения: ${error.message}`);
    }
});

// Отправка стартового сообщения
async function sendStartMessage(chatId, userName) {
    try {
        const imageUrl = "https://krasivosvetim.ru/image/cache/catalog/0_banneri/%D0%BF%D1%80%D0%B8%D0%BC%D0%B5%D1%801-500x500.jpg";
        await bot.sendPhoto(chatId, imageUrl, {
            caption: `Здравствуйте ${userName} 👋🏽\nЗарегистрируйтесь в программе лояльности Красиво Светим и получите скидку 5%.`
        });
        
        await bot.sendMessage(chatId, "Для продолжения регистрации необходимо отправить номер телефона, нажав на соответствующую кнопку ниже", {
            reply_markup: {
                keyboard: [[{
                    text: 'Отправить номер телефона',
                    request_contact: true
                }]],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    } catch (error) {
        console.error(`Ошибка при отправке стартового сообщения: ${error.message}`);
    }
}

// Сохранение номера телефона в базе данных
async function savePhoneNumberToDatabase(phoneNumber, userId, chatId) {
    try {
        const formData = new URLSearchParams();
        formData.append('PhoneNumber', phoneNumber);
        formData.append('Id_user', userId);
        const response = await axios.post('https://krasivotgweb.ru/systemclient/check_user_tg_bot.php', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const responseString = response.data;
        console.log(responseString);
        if (responseString.includes('Новый пользователь зарегистрирован')) {
            await bot.sendMessage(chatId, 'Ваш номер телефона успешно зарегистрирован.', {
                reply_markup: { remove_keyboard: true }
            });
            await sendStartMessage2(1, chatId);
        } else if (responseString.includes('Пользователь уже зарегистрирован')) {
            await bot.sendMessage(chatId, 'Номер телефона успешно подтвержден!', {
                reply_markup: { remove_keyboard: true }
            });
            await sendStartMessage2(0, chatId);
        } else {
            await bot.sendMessage(chatId, 'Произошла ошибка при регистрации номера телефона.', {
                reply_markup: { remove_keyboard: true }
            });
        }
    } catch (error) {
        console.error(`Не удалось подключиться: ${error.message}`);
        await bot.sendMessage(chatId, 'Произошла ошибка при попытке регистрации номера телефона.', {
            reply_markup: { remove_keyboard: true }
        });
    }
}

// Отправка сообщения с картой
async function sendStartMessage2(value, chatId) {
    try {
        const inlineKeyboard = {
            inline_keyboard: [[{
                text: 'Моя карта 💳',
                web_app: { url: 'https://krasivotgweb.ru/systemclient/index.php' }
            }]]
        };

        if (value === 0) {
            await bot.sendMessage(chatId, 'Вы уже участвуете в нашей программе лояльности! Ваша карта доступна по кнопке ниже:', {
                reply_markup: inlineKeyboard
            });
        } else {
            await bot.sendMessage(chatId, 'Ваша карта доступна по кнопке ниже:', {
                reply_markup: inlineKeyboard
            });
        }
    } catch (error) {
        console.error(`Ошибка при отправке сообщения: ${error.message}`);
    }
}
