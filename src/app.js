import express from "express";
import handlebars from 'express-handlebars';
import __dirname from './utils.js'
import { Server } from "socket.io";
import session from "express-session";
import productRouter from "./controllers/file-routes/products.route.js"
import cartRouter  from "./controllers/file-routes/carts.route.js";
import viewRouter from "./routes/views.routes.js"
import MongoStore from 'connect-mongo';
import mongoose from "mongoose";
import { messageModels } from "./models/mongo-models/messaje.js";
import ProductRouter from "./controllers/db-routes/products.route.js";
import CartsRouter from "./controllers/db-routes/carts.route.js";
import userViewsRouter from "./routes/user.views.routes.js";
import sessionsRouter from "./controllers/sessions.routes.js";
import passport from 'passport';
import initializePassport from "./config/passport.config.js";
import githubLoginViewRouter from './controllers/github-login.views.router.js';
import cookieParser from 'cookie-parser';
import jwtRouter from './controllers/jwt.routes.js';
import usersRouter from './controllers/user.routes.js';
import usersViewRouter from './routes/user.views.routes.js';
import UsersExtendRouter from './controllers/custom/users.extend.router.js';
import config from './config/config.js';


const app = express();
const PORT = 8080


app.use(express.json())
app.use(express.urlencoded({extended:true}));


app.engine('handlebars', handlebars.engine());
app.set('views', __dirname + "/views");
app.set('view engine', 'handlebars')

app.use(express.static(__dirname + "/Public"))
app.use(cookieParser("CoderS3cr3tC0d3"));

app.use(session({
  store: MongoStore.create({
    mongoUrl: 'mongodb+srv://silvamatias07:J5DdC6lnaBueAeW7@cluster0.6vafnod.mongodb.net/ecommerce?retryWrites=true&w=majority&appName=Cluster0',
    mongoOptions: { useNewUrlParser: true, useUnifiedTopology: true },
    ttl: 10 * 60
}),
  secret: 'coderS3cr3t',
  resave: false,
  saveUninitialized: true, 
  cookie: { maxAge: 80000 }
}))

initializePassport();
app.use(passport.initialize());
app.use(passport.session());
 

app.use("/fs/products", productRouter)
app.use("/fs/carts", cartRouter)
app.use("/", viewRouter)
app.use("/realTimeProducts", viewRouter)
app.use("/api/carts", CartsRouter)
app.use("/api/productos", ProductRouter)
app.use("/carrito", CartsRouter)
app.use("/users", userViewsRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/github", githubLoginViewRouter);
app.use("/users", usersViewRouter);
app.use("/api/jwt", jwtRouter);
app.use('/api/users', usersRouter);


const usersExtendRouter = new UsersExtendRouter();
app.use("/api/extend/users", usersExtendRouter.getRouter());





app.get('/session', (req, res) => {
  if (!req.session) {
    req.session = {};
  }

  if (req.session.counter) { 
      req.session.counter ++
      res.send(`Se ha visitado este sitio ${req.session.counter} veces.`);
  } else {
      req.session.counter = 1;
      res.send("Bienvenido!")
  }
});

const SERVER_PORT = config.port;

const httpServer = app.listen(SERVER_PORT, () => {
    console.log(`Servidor con express Puerto ${SERVER_PORT}`);
})

const socketServer = new Server(httpServer);

const messages = [];
socketServer.on('connection', socket => {
    // Esto lo ve cualquier user que se conecte
    socketServer.emit('messageLogs', messages);



    // aqui vamos a recibir { user: user, message: catBox.value }
    socket.on("message", data => {
      const newMessage = new messageModels({
        user: data.user,
        message: data.message
      });

      newMessage.save()
            .then(() => {
                messages.push(data); 
        // enviamos un array de objetos ---> [{ user: "Juan", message: "Hola" }, { user: "Elias", message: "Como estas?" }]
        socketServer.emit('messageLogs', messages);
    });
  });

    // hacemos un broadcast del nuevo usuario que se conecta al chat
    socket.on('userConnected', data => {
        console.log(data);
        socket.broadcast.emit('userConnected', data.user)
    })


    // Cuando desees cerrar la conexión con este cliente en particular:
    socket.on('closeChat', data => {
        if (data.close === "close")
            socket.disconnect();
    })

})
app.post("/message", async (req, res) => {
    try {
      const messages = await messagesModels.inserMany();
      res.send({ result: "success", payload:messages });
    } catch (error) {
      console.log(error);
      res.status(500).send({ error: -1, description: "Error al guardar los mensajes" });
    }
  });

  const URL_MONGO = 'mongodb+srv://silvamatias07:J5DdC6lnaBueAeW7@cluster0.6vafnod.mongodb.net/ecommerce?retryWrites=true&w=majority&appName=Cluster0'
const connectMOngooDb = async () =>{
  try {
    mongoose.connect(URL_MONGO)
    console.log("conectado con exito a MongoDb con Mongoose");
    const db = mongoose.connection;
    await db.createCollection("messages");
  } catch (error) {
    console.log("no se pudo conectara la DB usando Mongose" + error);
    process.exit();
  }
};

connectMOngooDb();