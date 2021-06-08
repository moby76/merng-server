const { Schema, model } = require('mongoose')

const postSchema = new Schema({//пост
   body: String,//тело поста
   userName: String,//пользователь создавший пост
   createdAt: String,//когда создан пост
   comments: [//комментарии к посту - массив
      {
         body: String,//тело комментария
         userName: String,//пользователь создавший коммент
         createdAt: String//когда создан коммент
      }
   ],
   likes: [
      {
         userName: String,//
         createdAt: String//
      }
   ],
   user:{//Поле ID - служит для связи между моделями
      type: Schema.Types.ObjectId,
      ref: 'users'//ссылочное поле
   }
})

module.exports = model('Posts', postSchema)