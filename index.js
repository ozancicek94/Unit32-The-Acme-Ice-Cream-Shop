const pg = require('pg');
const express = require('express');
const client = new pg.Client(process.env.DATABASE_URL || 'postgress://localhost/the_acme_flavors_db');
const app = express();

//parse the incoming requests from JSON

app.use(express.json());

//log the requests

app.use(require('morgan')('dev'));

//app routes here

app.post('/api/flavors', async(req,res,next) =>{
  try{
    const SQL = `
    INSERT INTO flavors (name, is_favorite) VALUES ($1, $2) RETURNING *
    `;

    const response = await client.query(SQL, [req.body.name, req.body.is_favorite]);

    res.send(response.rows[0]);

  } catch(error){next(error)}
} );

app.get('/api/flavors', async(req,res,next) => {
  try{

    const SQL = `
    SELECT * FROM flavors ORDER BY created_at DESC;
    `;

    const response = await client.query(SQL);

    res.send(response.rows);

  } catch(error){next(error)}
});

app.get('/api/flavors/:id', async(req,res,next) => {
  try{

    const SQL = `
    SELECT * FROM flavors
    WHERE id=$1
    `;

    const response = await client.query(SQL, [req.params.id]);

    if (response.rows.length === 0) {
      return res.status(404).send({error: 'Flavor not found'});
    }

    res.send(response.rows[0]);

  } catch(error){next(error)}
});


app.put('/api/flavors/:id', async(req,res,next) => {
  try{

    const SQL = `
    UPDATE flavors
    SET name=$1, is_favorite=$2, updated_at=now()
    WHERE id=$3 RETURNING *
    `;

    const response = await client.query(SQL, [req.body.name, req.body.is_favorite, req.params.id]);

    res.send(response.rows[0]);

  } catch(error){next(error)}
});

app.delete('/api/flavors/:id', async(req,res,next) => {
  try{

    const SQL = `
    DELETE FROM flavors
    WHERE id=$1
    `;

    const response = await client.query(SQL, [req.params.id]);

    res.sendStatus(204);

  } catch(error){next(error)}
} )

//create the init function here

const init = async() => {

  await client.connect();
  console.log("Successfully connected to the database!");

  let SQL = `
  DROP TABLE IF EXISTS flavors;

  CREATE TABLE flavors(
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
  )
  `;

  await client.query(SQL);
  console.log("Tables are created successfully!");

  SQL = `
  INSERT INTO flavors (name, is_favorite) VALUES ('Datca Honey Almond', TRUE);
  INSERT INTO flavors (name, is_favorite) VALUES ('Cookies and Cream', TRUE);
  INSERT INTO flavors (name, is_favorite) VALUES ('Orange', FALSE);
  `;

  await client.query(SQL);
  console.log("Data seeded!");

  const port = process.env.PORT || 3000;

  app.listen(port, () => {console.log(`Listening on port ${port}`)});

};

//invoke the init function

init();

