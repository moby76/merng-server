//в этом файле объединяем все преобразователи


const postsResolvers = require('./posts')//преобразователь для постов
const usersResolvers = require('./users')//преобразователь для пользователей
const commentsResolvers = require('./comments')//преобразователь для комментариев

module.exports = {
   Post: {//пробросим Посты
      //реализуем простые счётчики. параметр parent обозначает обрачение к вышестоящему(родительскому), в данном случае - это Post
      likeCount(parent){
         // console.log(parent)
         return parent.likes.length
      },
      commentCount(parent){
         return parent.comments.length
      }
   },
   Query: {//пробросим запросы
      ...postsResolvers.Query//запрос в постах
   },
   Mutation: {//пробросим мутации
      ...usersResolvers.Mutation,
      ...postsResolvers.Mutation,
      ...commentsResolvers.Mutation
   },
   Subscription: {//проброс подписок
      ...postsResolvers.Subscription
   }
}