//Разрешители/распознаватели для Постов
// -- Используются методы mongoose (https://mongoosejs.com/docs/api/model.html)

//получить подкласс PubSub для управления подписками из пакета graphql-subscriptions
const { PubSub } = require('graphql-subscriptions')

//создать инстанс от подкласса PubSub
const pubSub = new PubSub()

// получим утилиту проверяющую разрешение редактирования постов
const checkAuth = require('../../utils/check-auth')

//получим утилиту/подкласс ошибок при идентификации из Аполло-сервера
const { AuthenticationError, UserInputError } = require('apollo-server-express')

//подключаем обработчик/подкласс ошибок для пользователей из пакета apollo-server-errors
// Операция GraphQL включает недопустимое значение для аргумента поля.
// const { UserInputError } = require('apollo-server')

//создаём резольверы (функции-преобразователи) согласно названиям мутаций в файле typeDefs
module.exports = {
   //Запросы   
   Query: {
      //реализация запроса getPosts(получения ВСЕХ постов)
      async getPosts(_, __, { Post }) {
         try {
            //получит все посты и отсортировать их по дате создания(по убыванию (-1))
            const posts = await Post.find({}).sort({ createdAt: -1 })
            return posts
         } catch (error) {
            throw new Error(error)
         }
      },

      //реализация запроса getPost(получения ОДНОГО поста)
      async getPost(_, { postId }, { Post }) {
         try {
            //создать константу нахождения поста по id . Метод findById библиотеки mongoose
            const post = await Post.findById(postId)
            //если ответ не пустой то вернём пост
            if (post) {
               return post
            } else {
               throw new Error('Post not found')
            }
         } catch (error) {
            throw new Error(error)
         }
      }
   },

   //добавляем мутации для постов
   Mutation: {
      //Создать мутацию для создания поста - возможность добавления поста пользователем
      async createPost(_, { postInput: { body } }, context) {
         //создать константу = утилитой проверки соответствия пользователя с передачей в неё контекста из аполло сервера в качестве аргумента параметра 
         const user = checkAuth(context)// console.log(user)

         //реализуем проверку
         if (body.trim() === '') {//если body(без пробелов в начале и конце) - это пустая строка то:
            throw new Error('Post-body must not be empty')//тело поста не должно быть пустым
         }

         //если проверка пройдена успешно то:
         //создать новый пост используя модель описанную в файле Post(в моделях)
         //передав туда только те параметры на которые будет применено воздействие
         const newPost = await new context.Post({
            body: body,//тело поста
            user: user.id,//id пользователя для ссылочного поля user(будет определяться по ID пользователя из утилиты checkAuth)
            userName: user.userName,//имя пользователя присваивается от имени пользователя полученного из утилиты checkAuth
            createdAt: new Date().toISOString()
         })

         //для сохранения поста создать константу
         const post = await newPost.save()

         //разместим триггер для срабатывания подписки которую создали для реакции на создание новых постов
         //для этого нужно получить экземпляр PubSub из контекста(context) 
         //и опубликовать событие с помощью метода publish и вернуть нагрузку - сам новый пост
         pubSub.publish('NEW_POST', {
            //нагрузка
            newPost: post//newPost - название подписки в схеме graphql(typeDefs)
         })

         //и в конце вернуть этот пост
         return post
      },
      //Создать мутацию для обновления поста
      async updatePost(_, { postId, body }, context, info) {
         const post = await context.Post.findByIdAndUpdate(postId, { body }, { new: true })
         return post
         // const {userName} = checkAuth(context)
         // try {
         //    const postUpdate = await Post.findById(postId)
         //    if (userName === post.userName){
         //       await postUpdate.update(postId, {body}, {new: true})
         //    }
         //    return postUpdate
         // } catch (err) {
         //    throw new Error(err)
         // }
         // const postUpdate = 

      },
      //Создать мутацию для удаления поста
      async deletePost(_, { postId }, context) {
         //
         const { userName } = checkAuth(context)

         //пост может удалять только пользователь создавший его
         try {
            const post = await context.Post.findById(postId)
            //должно быть выполнено условие что совпадают имя пользователя и имя пользователя создавшего пост
            if (userName === post.userName) {
               //тогда выполняем удаление
               await post.remove()// или post.delete()
               //и выводим сообщение об успешном удалении поста
               return `Post ${post.body} deleted successfully`
            } else {//иначе если пользователь не тот который создал пост вернём ошибку
               throw new AuthenticationError('Action not allowed')
            }
         } catch (err) {
            throw new Error(err)
         }
      },

      //реализация создания/удаления лайков 
      async likePost(_, { postId }, context) {

         //получить имя пользователя для проверки пользователя из контекста на авторизацию по имени пользователя
         const { userName } = checkAuth(context)

         //найти пост по id 
         const post = await Post.findById(postId)

         //если пост найден
         if (post) {
            //убедиться что лайк создан текущим пользователем путём сравнения пользователя из лайка и пользователя
            if (post.likes.find(like => like.userName === userName)) {
               //пост уже отмечен лайком, снять отметку
               //сначала перезаписать массив с лайками оставив только те что не принадлежат данному пользователю, тем самым он удалится из массива 
               post.likes = post.likes.filter(like => like.userName !== userName)
               //сохраним пост

            } else {
               //пост не отмечен лайком, поставить отметку. Добавим в массив лайков через модель Post
               post.likes.push({
                  //и добавляем в нагрузку кто и когда создал лайк
                  userName,// присвоение имени пользователя текущего имени пользователя лайка
                  createdAt: new Date().toISOString()
               })
            }
            await post.save()
            return post
         } else {//если пост не создан
            throw new UserInputError('Post no found')
         }
      }
   },
   // создаём подписки для постов
   Subscription: {
      //подписка будет в виде объекта
      //преобразователи полей подписки - это объекты, которые определяют функцию подписки:

      //резольвер для подписки newPost
      newPost: {
         // Функция подписки (subscribe) должна возвращать объект типа AsyncIterator, стандартный интерфейс для перебора асинхронных результатов.
         //параметры parent и аргументы в данном случае не понадобятся. только экземпляр от PubSub переданный через контеккст Аполло сервера
         subscribe: () => pubSub.asyncIterator('NEW_POST')//создан новый тип подписки с названием NEW_POST
      }
   }
}