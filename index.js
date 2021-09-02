const express = require('express')
const mongoose = require('mongoose')//для связи с mongodb
const { ApolloServer } = require('apollo-server-express')//подключаем Аполло сервер, класс PubSub для реализации подписок
const { Promise } = require('mongoose')
const { ApolloServerPluginLandingPageGraphQLPlayground } = require('apollo-server-core')

//для управления подписками
const { createServer } = require ('http')
const { execute, subscribe } = require ('graphql')
const { SubscriptionServer } = require ('subscriptions-transport-ws')
const { makeExecutableSchema } = require ('@graphql-tools/schema')
const { PubSub } = require('graphql-subscriptions')

// const config = require('config')
//получаем порт из config и если он не определён в конфиге - пусть по умолчанию он 5000
// const PORT = config.get('port') || 5000
const { MONGODB } = require('./config/default');

const typeDefs = require('./graphql/typeDefs')//импортируем 
// const Post = require('./models/Post')
const resolvers = require('./graphql/resolvers')//получаем преобразователи из папки resolvers/ файл - index(не пишем т.к. index читается по умолчанию)

//Создайте экземпляр GraphQLSchema
//SubscriptionServer (экземпляр которого мы создадим далее) не принимает параметры typeDefs и resolvers. 
//Вместо этого требуется исполняемый файл GraphQLSchema. Мы можем передать этот объект схемы как SubscriptionServer, так и ApolloServer. 
//Таким образом, мы гарантируем, что в обоих местах используется одна и та же схема.
const schema = makeExecutableSchema({
   typeDefs,
   resolvers,
 })

//создаём новый экземпляр/инстанс от класса PubSub
const pubSub = new PubSub()

//Для использования Express в начале надо создать объект, который будет представлять приложение
const app = express()

//Затем, чтобы настроить серверы HTTP и WebSocket, нам нужно создать http.Server. 
//Сделайте это, передав ваше приложение Express функции createServer, которую мы импортировали из 
//модуля http:
const httpServer = createServer(app)

//получим порт из окружения или создадим непосредственно здесь
const PORT = 5000

//------ Создание функции запускающей сервер
async function startServer() {

   try {
      //инициируем подключение к БД.
      //параметром будет строка полученная из облачного сервиса-кластера 
      await mongoose.connect(MONGODB, {
         useNewUrlParser: true,
         useUnifiedTopology: true,
         useFindAndModify: false//параметр для корректной работы обновления документа в БД
         // useCreateIndex: true
      })

      //создаём экземпляр аполло-сервера 
      //и указываем какие сущьности он будет обрабатывать
      const server = new ApolloServer({
         schema,// (typeDefs, resolvers)
         plugins: [{
            async serverWillStart() {//плагин закрывающий соединение по вебсокету при отключении основного сервера
              return {
                async drainServer() {
                  subscriptionServer.close();
                }
              };
            }
          }],
         //сущьность контекста: запросы, подписки
         context: ({ req }) => ({ req, pubSub })
      })

      // запуск основного сервера
      await server.start()

      //сделать наше приложение Express как промежуточное ПО в нашем сервере (передать app в сервер)
      server.applyMiddleware({ app })

      //создать сервер для подписки. будет использоваться посредством Вебсокета из пакета subscriptions-transport-ws'
      SubscriptionServer.create(
         { 
            schema,// (typeDefs, resolvers)
            execute, 
            subscribe// передать функцию подписки
         },{ 
            server: httpServer, //созданный раннее сервер для участия приложения в подписках const httpServer = createServer(app)
            path: server.graphqlPath //путь в котором будет проходить сокет - наш основной сервер: const server = new ApolloServer
         }
       );

      await new Promise(resolve => httpServer.listen({ port: PORT }, resolve))
      //ендпоинт для запросов 
      console.log(`Query endpoint ready at http://localhost:${PORT}${server.graphqlPath}`)
      //ендпоинт для подписок на вебсокете ws://localhost:ПОРТ/путь
      console.log(`Subscription endpoint ready at ws://localhost:${PORT}${server.graphqlPath}`)
   } catch (error) {
      console.log(error)
   }
}

startServer()