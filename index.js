const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();


const app = express();

app.use(cors({
  origin: 'http://localhost'
}));



app.use(express.json());

const productos = [
  { id: 1, nombre: "Pizza de peperoni", precio: 110.0, descripcion: "Deliciosa pizza de peperoni" }

];
  
  app.get("/", (req, res) => {
    res.send("Node.js API");
  });
  
  app.get("/api/productos", (req, res) => {
    res.json(productos);
  });




  /*//*inicio de conexion a base de datos mysql------------------------------------------------------------------------------------------------------

  const db = mysql.createPool({
    connectionLimit: 10,  // Número máximo de conexiones simultáneas permitidas
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
  });
  
  // Verificar la conexión a la base de datos
  db.getConnection((err, connection) => {
    if (err) {
      console.error('Error de conexión a la base de datos:', err);
    } else {
      console.log('Conectado a la base de datos');
      connection.release();  // Liberar la conexión
    }
  });
  
  // Controlar errores de la base de datos
  db.on('error', (err) => {
    console.error('Error en la base de datos:', err);
  });
  
  module.exports = db;  // Exportar el objeto de conexión para su uso en otros módulos

  *///fin del codigo conexion base de datos mysql------------------------------------------------------------------------------------------------------

// Creasion de base de datos++++++++++++++++++++++++++++++++++++++++++++++++++

// Creasion de base de datos

// Configuración de la conexión a la base de datos MySQL
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
};

console.log('Configuración de conexión:', process.env.DB_HOST, process.env.DB_USER, process.env.DB_PASSWORD, process.env.DB_DATABASE);

// Crear un pool de conexiones a la base de datos
const db = mysql.createPool(dbConfig);

// Escuchar cuando el pool de conexiones esté listo
db.on('acquire', function (connection) {
  console.log('Conexión adquirida desde el pool');
});

// Realizar una consulta SELECT
db.query('SELECT * FROM nombre_de_la_tabla', (selectErr, results) => {
  if (selectErr) {
    console.error('Error al realizar la consulta:', selectErr);
  } else {
    // Mostrar los resultados en la consola
    console.log('Resultados de la consulta:', results);
  }

  // Cerrar el pool de conexiones después de la consulta
  db.end();
});

// Escuchar errores del pool de conexiones
db.on('error', (err) => {
  console.error('Error en el pool de conexiones:', err);
});

// Exportar el objeto de conexión para su uso en otros módulos
module.exports = db;

// fin de Creasion de base de datos ++++++++++++++++++++++++++++++++++++++++++





//consulta de la base de datos//////////////////////////////////////////////////////


//fin de la consulta de la base de datos ////////////////////////////////////////7///









const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Escuchando en el puerto ${port}...`));
