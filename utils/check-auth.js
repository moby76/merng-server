//утилита выполняющая проверку пользователя на роль соответствия для разрешения редактировать посты

//получим утилиту ошибок при идентификации из Аполло-сервера
const { AuthenticationError } = require('apollo-server-express')

//подключаем  jsonwebtoken
const jwt = require('jsonwebtoken')

//подключаем конфиг для получения секрета
// const config = require('config')
const { SECRET } = require('../config/default')

// const SECRET_KEY = config.get('jwtSecret')

module.exports = (context) => {
   //создаём заголовки/headers на основании контекста запроса сформированного пакетом аполло-сервер и переданного на проверку из резольвера posts
   const authHeader = context.req.headers.authorization

   if (authHeader) {//если authHeader есть то:
      //нужно получить токен из сформированного значения authHeader --^ который прописан в строке после слова Bearer ... 
      //нам нужно будет разделить массив authHeader по слову Bearer_ и получить второе значение (индекс[1]), в котором и будет сам токен пользователя
      const token = authHeader.split('Bearer ')[1]
      //если токен существует 
      if(token){
         //нужно верифицировать токен убедиться что он принадлежит 
         try{
            const user = jwt.verify(token, SECRET)
            return user
         } catch(err) {
            // пробросим ошибку используя утилиту из аполло-сервера
            throw new AuthenticationError('Invalid/Expired token')
         }
      }
      //Если токен не обнаружен
      throw new Error ('Authentication token must be \'Bearer [token]')
   }
   //В случае если вообще не обнаружены authHeader то:
   throw new Error ('Authorization header must be provided')
}