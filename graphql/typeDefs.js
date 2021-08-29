const { gql } = require('apollo-server')//или можно использовать комментарий /* GraphQL */ после module.exports = 

//создать запрос на определение типов (types definitions)
module.exports = gql`
   type Post{
      id: ID!
      body: String!
      createdAt: String!
      userName: String!
      # комментарии по модели Comment. ! означает что массив вернётся даже если он пуст 
      comments: [Comment]!
      # лайки по модели Like
      likes: [Like]!
      #реализуем счётчик лайков на стороне рервера
      likeCount: Int!
      #И счётчик комментариев
      commentCount: Int!,
      User: User!
   }
   type Comment{
      id: ID! 
      createdAt: String!     
      userName: String!      
      body: String!
   }
   type Like{
      id: ID!       
      createdAt: String!
      userName: String!
   }
   type User{
      id: ID!
      email: String!
      token: String!
      userName: String!
      createdAt: String!
   }
   # Тип для ввода данных
   input RegisterInput{
      userName: String!
      password: String!
      confirmPassword: String!
      email: String!
   }
   input PostInput{
      body: String!
   }
   # Тип - запрос
   type Query{
      # получить все посты
      getPosts: [Post]
      # получить 1 пост по id
      getPost(postId: ID!): Post
   }
   # мутации(аналог post/delete/update-запросов в REST)
   type Mutation {
      # Зарегестрироватьт пользователя
      register(registerInput: RegisterInput): User!
      # Осуществить вход 
      login(userName: String!, password: String!): User!
      # мутация для Создания статьи/поста. берёт только поле body и вернёт пост
      # createPost(body: String!): Post!
      createPost(postInput: PostInput!): Post!
      # мутация для удаления поста. Вернёт строку, типа 'Post deleted successfully'
      deletePost(postId: ID!): String!
      # мутация для создания комментария. будет определяться по id поста и создавать body вернёт пост который прокомментировали
      createComment(postId: ID!, body: String!): Post!
      # мутация для удаления комментария
      deleteComment(postId: ID, commentId: ID): Post!
      #мутация для создания/удаления лайка. будет работать как переключатель - понадобится только ID поста
      likePost(postId: ID): Post!, 
      # обновить пост
      updatePost(postId: ID!, body: String!): Post!
   }
   # Тип - подписки
   type Subscription {
      # подписка на новые посты
      newPost: Post!
   }
`