const { gql } = require('apollo-server')

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
      commentCount: Int!
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
   input RegisterInput{
      userName: String!
      password: String!
      confirmPassword: String!
      email: String!
   }
   # Тип - запрос
   type Query{
      # получить все посты
      getPosts: [Post]
      # получить 1 пост по id
      getPost(postId: ID!): Post
   }
   # мутации(аналог post-запросов в REST)
   type Mutation {
      # Зарегестрироватьт пользователя
      register(registerInput: RegisterInput): User!
      # Осуществить вход 
      login(userName: String!, password: String!): User!
      # мутация для Создания статьи/поста. берёт только поле body и вернёт пост
      createPost(body: String!): Post!
      # мутация для удаления поста
      deletePost(postId: ID!): String!
      # мутация для создания комментария. будет определяться по  id поста и создавать body вернёт пост который прокомментировали
      createComment(postId: String!, body: String!): Post!
      # мутация для удаления комментария
      deleteComment(postId: ID, commentId: ID): Post!
      #мутация для создания/удаления лайка. будет работать как переключатель - понадобится только ID поста
      likePost(postId: ID): Post! 
   }
   # Тип - подписки
   type Subscription {
      # подписка на новые посты
      newPost: Post!
   }
`