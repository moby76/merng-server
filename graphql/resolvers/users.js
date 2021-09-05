const bcrypt = require('bcryptjs')//подключаем библиотеку bcryptjs
const jwt = require('jsonwebtoken')//подключаем jsonwebtoken для регистрации
const config = require('config')//подключаем конфиг для получения секрета
const { UserInputError } = require('apollo-server-express')//подключаем обработчик ошибок для пользователей из пакета apollo-server-errors
// Операция GraphQL включает недопустимое значение для аргумента поля.

//получаем валидатор validateRegisterInput и validateLoginInput из validators
const { validateRegisterInput, validateLoginInput } = require('../../utils/validators')

//получить секретный ключ из 
const { SECRET } = require('../../config/default')

//получаем модель пользователя из папки с моделями
// const User = require('../../models/User')

//сгенерируем токен для пользователя
function generateToken(user) {
   return jwt.sign({
      id: user.id,//параметры для шифрования 
      email: user.email,
      userName: user.userName
   },
      SECRET,//секрет из конфига
      { expiresIn: '1h' }//срок действия токена (1 час)
   )
}


//создать мутации для пользователя
module.exports = {
   Query: {
      async getUsers(_, __, { User }){
         try {
            //получит все посты и отсортировать их по дате создания(по убыванию (-1))
            const users = await User.find({}).sort({ createdAt: -1 })
            return users
         } catch (error) {
            throw new Error(error)
         }
      }
   },
   Mutation: {//асинхронная ф-ция
      //мутация для входа в систему
      async login(_, { userName, password }, { User }) {
         //Выполнить проверку правильности заполнения формы входа - валидацию данных
         const { errors, valid } = validateLoginInput(userName, password)//получить значения из валидатора и применить их к :

         //сначала проверить поля на валидность
         if (!valid) {
            throw new UserInputError('Errors', { errors });
         }

         //найти пользователя в БД
         const user = await User.findOne({ userName })
         //если пользователь не создан то пробросить ошибку
         if (!user) {
            errors.general = 'User not found'
            throw new UserInputError('User not found', { errors })
         }

         //сравнить пароли
         const match = await bcrypt.compare(password, user.password)
         //Если пароли не равны то
         if (!match) {
            errors.general = 'Wrong credentials'
            throw new UserInputError('Wrong credentials', { errors })
         }

         //но если пароли совпадают то токен
         const token = generateToken(user)

         return {
            ...user._doc,
            id: user._id,
            token
         }
      },

      //мутация для регистрации пользователя
      async register(_, { registerInput: { userName, email, password, confirmPassword } }, { User }){
         //Выполнить проверку правильности заполнения формы регистрации - валидацию данных
         const { valid, errors } = validateRegisterInput(//получить значения из валидатора и применить их к :
            userName,
            email,
            password,
            confirmPassword
         )
         if (!valid) {
            throw new UserInputError('Errors', { errors })
         }

         //Проверить есть-ли такой пользователь в системе. метод findOne по полю userName
         const user = await User.findOne({ userName })
         if (user) {//если существует (!== 0) то выполним выедем ошибку с помощью метода UserInputError из apollo-server
            throw new UserInputError('Username is taken', {//
               errors: {
                  userName: 'This username is taken'//для фронтенда
               }
            })
         }

         //сначала нужно захэшировать его пароль метод .hash(библиотека bcryptjs)
         password = await bcrypt.hash(password, 12)

         //теперь можно создать нового пользователя используя модель User с передачей в него значений
         const newUser = new User({
            email,
            userName,
            password,
            createdAt: new Date().toISOString()
         })

         //результирующий
         const result = await newUser.save()//сохранить в БД

         //авторизацию выполняем по JSON Web Token (JWT) с помощью пакета jsonwebtoken с 3 параметрами
         const token = generateToken(result)

         return {
            ...result._doc,
            id: result._id,
            token
         }
      }
   }
}