const { ApolloServer, PubSub } = require('apollo-server')//подключаем Аполло сервер, класс PubSub для реализации подписок

const mongoose = require('mongoose')//для связи с mongodb
// const config = require('config')
//получаем порт из config и если он не определён в конфиге - пусть по умолчанию он 5000
// const PORT = config.get('port') || 5000
const { MONGODB } = require('./config/default');

//

const typeDefs = require('./graphql/typeDefs')//импортируем схему типов graphQL

const resolvers = require('./graphql/resolvers')//получаем преобразователи из папки resolvers/ файл - index(не пишем т.к. index читается по умолчанию)

//создаём новый экземпляр/инстанс от класса PubSub
const pubSub = new PubSub()

//получим порт из окружения
const PORT = process.env.PORT || 5000

//создаём экземпляр аполло-сервера 
//и указываем какие сущьности он будет обрабатывать
const server = new ApolloServer({
   typeDefs,
   resolvers,
   //сущьность контекста: запросы, подписки
   context: ({ req }) => ({ req, pubSub })
})

//инициируем подключение к БД.
//параметром будет строка полученная из облачного сервиса-кластера 
mongoose.connect(MONGODB, {
   useNewUrlParser: true,
   useUnifiedTopology: true,
   // useCreateIndex: true
})
   //создаём слушателя на изменения для сервера
   .then(() => {
      console.log('Mongodb connected')
      return server.listen({port: PORT })
   })
   .then(res => {
      console.log(`server runing at ${res.url}`)
   })
   .catch(err => {
      console.error(err)
   })


