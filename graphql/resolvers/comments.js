// const Post = require('../../models/Post')//получим модель поста

// получим утилиту проверяющую разрешение редактирования постов
const checkAuth = require('../../utils/check-auth')

//подключаем обработчик ошибок для пользователей из пакета apollo-server-errors
// Операция GraphQL включает недопустимое значение для аргумента поля.
const { AuthenticationError, UserInputError } = require('apollo-server-express')

//получим утилиту ошибок при идентификации из Аполло-сервера
// const { AuthenticationError } = require('apollo-server')

module.exports = {
   Mutation: {
      //реализация создания комментария
       async createComment(_, {postId, body}, context){
         const { userName } = checkAuth(context)//получим имя пользователя из контекста 
         //реализуем создание комментария
            //сначала прорверить - пустое-ли поле body
            if(body.trim() === ''){
               //Пробрасываем ошибку
               throw new UserInputError('Empty comment', {
                  //и в качестве полезной нагрузки тело ошибки
                  errors: {
                     body: 'Comment must not be empty'
                  }
               })

            }
            //если поле body не пустое то:
               //найти пост по id
            const post = await context.Post.findById(postId)

            // если пост есть то: 
            if(post){
               //1 добавим в начало массива с комментариями новое значение
               post.comments.unshift({//Метод unshift () добавляет один или несколько элементов в начало массива и возвращает новую длину массива.
                  body,
                  userName,
                  createdAt: new Date().toISOString()
               })
               //2 после чего сохраним пост с комментариями в БД
               await post.save()
               //3 вернём пост
               return post
            } else {//Но если поста нет вернём ошибку
               throw new UserInputError('Post not found')
            }        
      },
      //реализация удаления комментария
      async deleteComment(_, { postId, commentId }, context){
         const { userName } = checkAuth(context)//получим имя пользователя из контекста 

         //найти пост по id
         const post = await context.Post.findById(postId)

         //если пост существует то
         if(post){
            //нужно найти комментарий в массиве комментариев по индексу. Метод findIndex(). сравнивать и находить по совпадению индексов комментария
               //сначала создать константу - индекса
            const commentIndex = post.comments.findIndex((comment) => comment.id === commentId)

            //Проверить и исключить возможность удаления коммента другим пользователем
               //если: имя пользователя из комментария с индексом определённым выше совпадает с именем пришедшим из контекста(токена)
            if(post.comments[commentIndex].userName === userName){

               //после чего удалить этот индекс используя метод splice по индексу commentIndex
               post.comments.splice(commentIndex, 1)

               //и сохранить пост
               await post.save()

               //вернуть его
               return post
            } else { //иначе, если пользователь пытающийся удалить комментарий не совпадает то:
               //пробросим ошибку аутетнтификации
               throw new AuthenticationError('Action not allowed')
            }
            
         } else {//если ПОСТ не существует
            //пробросим ошибку используя подкласс ошибок UserInputError
            throw new UserInputError('Post not found')

         }         

      }      
   }
}