// const { addErrorLoggingToSchema } = require("apollo-server")

//создадим валидатор для полей регистрации пользователя. стрелочная функция
module.exports.validateRegisterInput = (
   //поля для проверки
   userName,
   email,
   password,
   confirmPassword
) => {
   //константа для ошибок. пустая по умолчанию
   const errors = {}
   //проверка имени пользователя
   if(userName.trim() === ''){//если поле пустое то создаём ошибку
      errors.userName = 'Username mast not be empty'
   }
   //проверка поля почты
   if(email.trim() === ''){//если поле пустое то создаём ошибку
      errors.email = 'Email mast not be empty'
   } else {//и если поле не пустое проверяем дальше регулярным выражением
      const regEx = /^([0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*@([0-9a-zA-Z][-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,9})$/
      if(!email.match(regEx)){//если значение не совпадает с --^
         errors.email = 'Email mast have a valid address'
      }
   }
   //проверка пароля
   if(password.trim() === ''){
      errors.password = 'Password is must not be empty'
   } else if(password !== confirmPassword){//иначе: если введёный пароль не равен подтверждённому
      errors.confirmPassword = 'Passwords mast be matched'
   }

   return {
      errors,
      valid: Object.keys(errors).length < 1//полю valid присваивается логическое true при условии что длина объекта созданного на основании ключей значений поля errors = 0. иначе false
   }
}

//Валидация входа пользователя(логин). стрелочная функция
module.exports.validateLoginInput = (userName, password) => {
   const errors = {}
   //проверка имени пользователя
   if(userName.trim() === ''){//если поле пустое то создаём ошибку
      errors.userName = 'Username must not be empty'
   }
   //проверка пароля
   if(password.trim() === ''){//если поле пустое то создаём ошибку
      errors.password = 'Password is must not be empty'
   }

   return {
      errors,
      valid: Object.keys(errors).length < 1//полю valid присваивается логическое true при условии что длина объекта созданного на основании ключей значений поля errors = 0. иначе false
   }
}