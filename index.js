const express = require('express');
const sqlite3 = require('sqlite3');
const cors = require('cors'); // Importa el paquete cors
const axios = require('axios');//PUSHBULLET requiere axios
const bodyParser = require('body-parser');  // Agrega esta línea para importar bodyParser
const app = express();
let notificacion2 = 0;

const pushbulletKey = 'o.W3Xuew3bqfSawkyVmVN5MmwsnK2QYd6F'; //API key pushbullet
app.use(express.json()); // Middleware para analizar el cuerpo de la solicitud como JSONs


// Middleware para permitir CORS
app.use(cors());
//app.use(bodyParser.json()); // Middleware para parsear el cuerpo de la solicitud en JSON
app.use(express.json()); // Utiliza el middleware incorporado para analizar el cuerpo en JSON

// Middleware para parsear el cuerpo de las solicitudes como JSON
app.use(bodyParser.json());

// Crea una nueva base de datos SQLite en disco
const db = new sqlite3.Database('bd.db', {
  memory: false,
});

// Conexion base de datos usuarios
const dbUsuarios = new sqlite3.Database('bd2.db', {
  memory: false,
});

// Crea una tabla de usuarios
db.serialize(() => {
  // Verifica si la tabla existe
  db.get("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='usuarios'", (err, fila) => {
    if (err) {
      console.error(err);
    } else {
      if (fila['COUNT(*)'] === 0) {
        // Crea la tabla si no existe
        db.run("CREATE TABLE usuarios (usuario VARCHAR(255) PRIMARY KEY, contraseña VARCHAR(255))");
      }
    }
  });
});












//RUTAS DE LA API

// Ruta POST para manejar la disponibilidad
app.post('/disponibilidad', async (req, res) => {
  try {
    // Obtén los datos de disponibilidad del cuerpo de la solicitud
    // const disponibilidad = req.body.disponibilidad;

    let precioEnvio;
    let disponibilidad = true;

    if (disponibilidad) {
      // Realizar la consulta SQL para obtener la disponibilidad
      const disponibilidadRow = await runQuery(db, 'SELECT disponibilidad FROM tienda WHERE id = 1');
      console.log('Imprimimos disponibilidad row para ver qué tienen dentro:', JSON.stringify(disponibilidadRow, null, 2));
      const disponibilidadRowJson = JSON.stringify(disponibilidadRow, null, 2);
      console.log('imprimimos disponibilidad aver que pasa ' + disponibilidadRow.disponibilidad);

//
      if (disponibilidadRow[0].disponibilidad === 'open' || disponibilidadRow[0].disponibilidad === 'closed') {
        console.log('La tienda está abierta');

        // Consulta SQL para obtener todos los productos y su disponibilidad
        const productos = await runQuery(db, 'SELECT id, precio, disponibilidad, nombre, url FROM productos');

        // Consulta SQL para obtener todos los precios de envío
        const preciosEnvio = await runQuery(db, 'SELECT costo FROM precioEnvio');

        // Imprimir o manejar los precios obtenidos
        preciosEnvio.forEach(row => {
          console.log('Precio de envío:', row.costo);
          precioEnvio = row.costo;
        });

        res.json({
          productos: productos.map(row => ({
            id: row.id,
            producto: row.nombre,
            precio: row.precio,
            disponibilidad: row.disponibilidad,
            url: row.url,
            
          })),
          precioEnvio: precioEnvio,
          disponibilidad: disponibilidadRow[0].disponibilidad
        });
      } else {
        res.json({ disponibilidad: 'closed' });
        console.log('Enviamos que la tienda está cerrada');
      }
    }
  } catch (error) {
    console.log('+++ Entramos en el catch +++++')
    console.error(error.message);
    res.status(500).json({ error: 'Error en la solicitud.' });
  }
});




app.post('/tienda', async (req, res) => {
  console.log('Aquí vemos que recibimos por parte del cliente ' + req.body.action);
  const statusTienda = req.body.action;

  try {
    // Realiza la lógica para cerrar o abrir la tienda según la acción recibida
    await actualizarDisponibilidadTienda(statusTienda);

    const respuesta = { status: statusTienda };
    res.json(respuesta);
  } catch (error) {
    console.error('Error al actualizar la disponibilidad de la tienda:', error);
    res.status(500).json({ error: 'Error interno del servidor', mensaje:'error' });
  }
});

// Función para actualizar la disponibilidad de la tienda en la base de datos SQLite
const actualizarDisponibilidadTienda = (nuevaDisponibilidad) => {
  return new Promise((resolve, reject) => {
    // Reemplaza 'bd' con tu conexión real a la base de datos SQLite
    db.run('UPDATE tienda SET disponibilidad = ? WHERE id = ?', [nuevaDisponibilidad, 1], function (error) {
      if (error) {
        reject(error);
      } else {
        console.log('actualizacion de estatus de la tienda correcto')
        resolve();
      }
    });
  });
};




//88888888888888-----OBTENER STATUS DEL PEDIDO DEL CLIENTE----88888888888888888888888888888888888888
app.post('/status-pedidos', (req, res) => {
  const datoRecibido = req.body.clave;
  let statusEnvio;

  //$$$$$$$$$$$$$$----CONSULTA SQLITE-----$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

  
// Definir la consulta
const consulta = `SELECT * FROM Pedidos WHERE keyUserName = ? AND estatusDelPedido = ?`;

// Parámetros para la consulta

const estatusDelPedido = 'enProceso';

// Ejecutar la consulta con parámetros
dbUsuarios.get(consulta, [datoRecibido, estatusDelPedido], (err, fila) => {
  if (err) {
    console.error(err.message);
    return;
  }

  // Aquí puedes trabajar con la fila obtenida
  if (fila) {
    console.log('estado preparacion: '+ fila.enPreparacion);
    console.log('Valor de estatusDelPedido:', fila.estatusDelPedido);
    statusEnvio = fila.estatusDelPedido;
    estadoPrep = fila.enPreparacion;
    let horaEstimada = fila.horaEstimada;
      // Envía una respuesta al cliente
    res.json({ mensaje: statusEnvio, 
               estado: estadoPrep, 
               hora:horaEstimada,
               precio: fila.precioEnvio +fila.total,
               id: fila.idPedido
              });

              console.log('identificador del pedido  '+fila.idPedido)

  } else {
    console.log('No se encontraron resultados para la consulta.');
    res.json({ mensaje:'no tienes ningun pedido en curso'});
    console.log('valor de status del pedio '+ statusEnvio);
  }


});

  //$$$$$$$$$$$$$$----END CONSULTA SQLITE-----$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$




});



//888888888888888888888888---CONSULTA ADMIMINISTRADOR---8888888888888888888888888888888
// Ruta para obtener pedidos en proceso
// Ruta para obtener pedidos en proceso
app.post('/estatus-de-pedidos', (req, res) => {
  // Verifica si se proporciona un cuerpo de solicitud JSON
  if (!req.body) {
      return res.status(400).json({ error: 'Cuerpo de solicitud JSON requerido.' });
  }

  // Puedes acceder a los datos de la solicitud POST con req.body
  const estatus = req.body.estatus; // Asegúrate de ajustar según la estructura de tu solicitud

  const query = "SELECT * FROM Pedidos WHERE estatusDelPedido = ?";

  dbUsuarios.all(query, [estatus], (err, rows) => {
      if (err) {
          console.error(err);
          res.status(500).json({ error: 'Error al obtener los datos de la base de datos.' });
      } else {
          res.json(rows);
      }
  });
});


//post modificar satuts de pedidos se maneja desde el administrador
app.post('/modificasion-status-pedidos', (req, res) => {
  const datosPedido = req.body; // Obtener los datos del cuerpo de la solicitud
  console.log('Datos del pedido:', datosPedido);

  // Resto de tu lógica para manejar el cambio de estado del pedido

  res.send('Solicitud recibida correctamente'); // Enviar una respuesta al cliente
});



// Ruta para actualizar el precio del pedido
app.post('/actualizar-precioPedido', (req, res) => {
  // Obtener los datos del pedido
  const pedido = req.body;
  const nuevoPrecio = pedido.precio;



  // Actualizar el precio del pedido en la base de datos
  const sql = 'UPDATE precioEnvio SET costo = ?';

  db.run(sql, [nuevoPrecio], function (error) {
    if (error) {
      console.error('Error al actualizar el precio del pedido:', error);
      res.status(500).json({
        mensaje: 'Error al actualizar el precio del pedido',
        error: error.message,
        precio: ('Error al modificar el precios')
      });
    } else {
      console.log('Precio del pedido actualizado correctamente');
      res.status(200).json({
        mensaje: 'Precio del pedido actualizado correctamente',
        precio: nuevoPrecio
      });
    }

    
  });
});



app.post('/hora-estimada', (req, res) => {

  resultado = req.body
  console.log(resultado.horaDeLlegada + '------')
  console.log(resultado.id.idPedido + '+++++')

  const horaEstimada = {
    id: 10,
  };


  const jsonResponse = {
    mensaje: 'respuesta enviada con éxito desde el servidor. Gracias por actualizar los datos'
  };

  // Consulta SQL para actualizar la horaDeLlegada en la tabla Pedidos
const sqlQuery = 'UPDATE Pedidos SET horaEstimada = ? WHERE idPedido = ?';

// Ejecutar la consulta con los parámetros
dbUsuarios.run(sqlQuery, [resultado.horaDeLlegada, resultado.id.idPedido], function(err) {
  if (err) {
    console.error('Error en la consulta:', err);
    res.status(500).send(err);
    return;
  }
    console.log('datos agregados con exito ')
    res.json(jsonResponse);
  });
});


//ruta de prueba}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}

app.get('/pedidos', (req, res) => {
  // Definir la consulta
  const consulta = `SELECT idPedido, nombre, direccion, estatusDelPedido, hora, metodoDePago, productos, total, horaEstimada FROM Pedidos WHERE estatusDelPedido = ? OR estatusDelPedido = ?`;
  const estatusDelPedido = 'enProceso';
  const estatusDelPedido2 = 'enCamino';
  const consultaPrecio = `SELECT costo FROM precioEnvio`

  // Crear un array para almacenar los pedidos
  const pedidos = [];

  const respuesta = {
    pedidos: [],  // Un array vacío inicialmente
    precioDelEnvio: 100
  };


  db.all(consultaPrecio, [], (err, filas) => {
    if (err) {
      console.error(err.message);
      return;
    }
  
    // Imprimir el resultado aquí
    filas.forEach((fila) => {
      console.log(`Costo: ${fila.costo}`);
      respuesta.precioDelEnvio = fila.costo;
    });
  });
  
  // Ejecutar la consulta con parámetros
  dbUsuarios.all(consulta, [estatusDelPedido, estatusDelPedido2], (err, filas) => {
  //dbUsuarios.all(consulta, [req.query.estatusDelPedido], (err, filas) => {   es para mejorar la seguridad peor no se como implementarlo
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Error al obtener los pedidos' });
    }

    // Aquí puedes trabajar con las filas obtenidas
    filas.forEach(fila => {
        console.log('trataremos de imprimir la fila total '+ fila.total );
        console.log('imprimimos el estatus ' + fila.estatusDelPedido)

      respuesta.pedidos.push({
        idPedido: fila.idPedido,
        nombre: fila.nombre,
        direccion: fila.direccion,
        estatusDelPedido: fila.estatusDelPedido,
        hora: fila.hora,
        metodoDePago: fila.metodoDePago,
        productos: fila.productos,
        total: fila.total,
        precioDelEnvio: 25,
        horaEstimada: fila.horaEstimada
      });
    });


    // Verificar si se encontraron resultados
    if (respuesta.pedidos.length > 0) {
      
    console.log ( '+++ ' + respuesta.pedidos + 'y acá mandamos la respuesta del precio de envio  '+respuesta.precioDelEnvio);
      res.json(respuesta);
    } else {
      res.json({ mensaje: 'No tienes ningún pedido en curso' });
    }
  });


});



//ruta de prueba}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}















// ruta pruba de simulacion de pedido y almacenar en base de datos 
// Ruta POST para crear un nuevo usuario
app.post('/pedidos', (req, res) => {
  // Obtener datos del cuerpo de la solicitud
  const { nombre, direccion, status, metodo_pago, keyusernew } = req.body;

  // Validar los datos (puedes agregar más validaciones según tus necesidades)
  if (!nombre || !direccion || !status || !metodo_pago || !keyusernew) {
    return res.status(400).json({ mensaje: 'Todos los campos son obligatorios.' });
  }

  // Insertar nuevo usuario en la base de datos
  dbUsuarios.run(
    'INSERT INTO DatosPedidos (nombre, direccion, estatusDelPedido, metodoDePago, keyUserName) VALUES (?, ?, ?, ?, ?)',
    [nombre, direccion, status, metodo_pago, keyusernew],
    function (err) {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ mensaje: 'Error al agregar el usuario a la base de datos.' });
      }

      const nuevoUsuario = {
        id: this.lastID,
        nombre,
        direccion,
        status,
        metodo_pago,
        keyusernew
      };

      res.status(201).json({ mensaje: 'Usuario creado exitosamente', usuario: nuevoUsuario });
    }
  );
});







// Ruta POST para manejar la función sendNotification a pushBullet
app.post('/enviar-notificacion', (req, res) => {
  const datosPedido = req.body;

  // Ahora puedes trabajar con el objeto datosPedido
  console.log('Datos del pedido:', datosPedido);
 let json =  JSON.stringify(datosPedido);
 const objetoNativo = JSON.parse(json);


 // Crear una cadena de texto con varias propiedades del objeto
 const cadenaDeTexto = `Productos: ${objetoNativo.productos.join('---')}\n` +

 `Coordenadas GPS: ${objetoNativo.coordenadasGPS}\n`+
 `numero telefonico: ${objetoNativo.telefono}\n`;


 console.log(objetoNativo.productos);


 
   

 
  if (!datosPedido) {
    return res.status(400).json({ error: 'El campo "mensaje" es requerido.' });
  }



   // Convertir la cadena JSON de vuelta a un objeto JavaScript necesario para manipular los datos
  // let mensajeParse = JSON.parse(datosPedido);
  //console.log('mensaje parseado  ' + mensajeParse);
  let direccion = objetoNativo.colonia +'  '+ objetoNativo.numeroCasa + '  '+ objetoNativo.nombreCalle; 
  let estatus = 'enProceso';
  let notas = ' sinNotasEspeciales';
  let restaurante = 'sinRestaurante';
  let estadoPreparacion = 'En Preparacion'
  sendNotification(cadenaDeTexto);
  crearNuevoPedidoEnBaseDeDatos(objetoNativo.nombre, direccion, estatus, notas, objetoNativo.fecha, objetoNativo.hora, restaurante, objetoNativo.metodoDePago, objetoNativo.keyUser, cadenaDeTexto, estadoPreparacion, objetoNativo.precioTotal)


  res.json({ mensaje: 'Notificación enviada con éxito.' });
  notificacion2 ++









});











//----------------------------------------------------------------
app.get("/", (req, resp) => {
  const query = "SELECT * FROM productos";

  db.all(query, (err, rows) => {
    if (err) {
      resp.status(500).json({ error: "Error al obtener productos" });
    } else {
      resp.json(rows);
    }
  });
});


app.get("/pedidosEnproceso", (req, resp) => {
  const query = "SELECT * FROM pedidosEnProceso";

  db.all(query, (err, rows) => {
    if (err) {
      resp.status(500).json({ error: "Error al obtener productos" });
    } else {
      resp.json(rows);
    }
  });
});



app.get("/productos", (req, resp) => {
  const query = "SELECT * FROM productos";

  db.all(query, (err, rows) => {
    if (err) {
      resp.status(500).json({ error: "Error al obtener productos" });
    } else {
      resp.json(rows);
    }
  });
});







// Variable global para almacenar el mensaje
let mensajeGlobal = "";


// Ruta para recibir mensajes mediante POST
app.post("/mensajes", (req, resp) => {
  try {
    const mensaje = req.body.mensaje;

    // Aquí puedes procesar el mensaje como desees, almacenarlo en la base de datos, etc.

    // Envía el mensaje de vuelta como respuesta
    resp.json({ mensaje: mensaje });
    mensajeGlobal = mensaje;
  } catch (error) {
    console.error(error);
    resp.status(500).json({ error: "Error interno del servidor" });
  }
});


app.post("/nuevopedido", (req, resp) => {
  // Aquí puedes acceder a los datos del cuerpo de la solicitud
  const { domicilio, productos, fecha, precioTotal } = req.body;

 // Realiza las operaciones necesarias con los datos
    // (puedes almacenarlos en la base de datos, procesarlos, etc.)

    // Imprime un mensaje en la consola del servidor
    //console.log(req.body);
    console.log("Pedido recibido exitosamente:", { domicilio, productos, fecha, precioTotal });

             // Insertar los datos en la base de datos
            const query = `INSERT INTO pedidosEnProceso (domicilio, productos, fecha, precioTotal) VALUES (?, ?, ?, ?)`;
            db.run(query, [domicilio, productos, fecha, precioTotal], function (err) {
              if (err) {
                  console.error('Error al insertar en la base de datos:', err);
                   resp.status(500).send('Error interno del servidor');
              } else {
                   console.log('Pedido guardado en la base de datos');
                  resp.send('Pedido recibido y guardado exitosamente');
                 }
    });

    // Envía una respuesta al cliente (puedes ajustar según sea necesario)
    //resp.send("Pedido recibido exitosamente");
});



app.get("/mensajes-sse", (req, resp) => {
  resp.setHeader("Content-Type", "text/event-stream");
  resp.setHeader("Cache-Control", "no-cache");
  resp.setHeader("Connection", "keep-alive");

  const enviarDatosSSE = (valor) => {
      resp.write(`data: ${valor}\n\n`);
  };

  const intervalId = setInterval(() => {
      

      // Envía el valor actual al cliente a través de SSE
      enviarDatosSSE(notificacion2);
      console.log('imprimimos la notificacion ' + notificacion2)
  }, 10000);

  req.on("close", () => {
      clearInterval(intervalId);
      resp.end();
  });
});



//Ruta para saber si hay pedido en curso en un lapso de 30 o hasta que recarga la pagina
app.post('/comprobacion-si-hay-pedido-en-curos', (req, res) => {
  // Definir la consulta
  const consulta = `SELECT estatusDelPedido FROM Pedidos WHERE keyUserName = ?`;
  const keyUser = req.body.keyUserName;
  console.log(req.body);


});


/*

  // Crear un array para almacenar los pedidos
  const pedidos = [];

  // Ejecutar la consulta con parámetros
  dbUsuarios.all(consulta, [keyUser], (err, filas) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Error al obtener los pedidos' });
    }

    // Aquí puedes trabajar con las filas obtenidas
    filas.forEach(fila => {
        console.log('fila del estatus del pedido'+ fila.estatusDelPedido );

      pedidos.push({
       
        estatusDelPedido: fila.estatusDelPedido,
      

      });
    });


    // Verificar si se encontraron resultados
    if (pedidos.length > 0) {
      
    console.log (pedidos);
      res.json(pedidos);
    } else {
      res.json({ mensaje: 'No tienes ningún pedido en curso' });
    }
  });

  console.log(pedidos);
});

*/









app.listen(9000,'0.0.0.0', () => {
  console.log('Servidor escuchando en el puerto 9000');
});



function sendNotification(mensaje) {
  axios.post(
    'https://api.pushbullet.com/v2/pushes',
    {
      type: 'note',
      title: 'Nuevo Pedido en curso',
      body: mensaje,
    },
    {
      headers: {
        'Access-Token': pushbulletKey,
        'Content-Type': 'application/json',
      },
    }
  )
  .then(function(response) {
    console.log(response.data);
  })
  .catch(function(error) {
    console.error(error);
  });
}

function crearNuevoPedidoEnBaseDeDatos(nombre, direccion, estatusDelPedido, notasEspeciales, fecha, hora, restaurante, metodoDePago, keyUserName, productos, enPreparacion, total) {
  dbUsuarios.run(
    'INSERT INTO Pedidos (nombre, direccion, estatusDelPedido, notasEspeciales, fecha, hora, restaurante, metodoDePago, keyUserName, productos, enPreparacion, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [nombre, direccion, estatusDelPedido, notasEspeciales, fecha, hora, restaurante, metodoDePago, keyUserName, productos, enPreparacion, total],



    function (err) {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ mensaje: 'Error al agregar el usuario a la base de datos.' });
      }

      
    }
  );
}


// Función para ejecutar una consulta y devolver una Promesa
function runQuery(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}
