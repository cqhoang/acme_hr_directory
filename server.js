require("dotenv").config();
const pg = require("pg");
const client = new pg.Client(
  process.env.DATABASE_URL || `postgres://localhost/${process.env.DB_NAME}`
);

const express = require("express");
const app = express();

app.use(express.json());
app.use(require("morgan")("dev"));

// READ departments
app.get("/api/departments", async (req, res, next) => {
  try {
    const SQL = `SELECT * from departments`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

// READ employees
app.get("/api/employees", async (req, res, next) => {
  try {
    const SQL = `SELECT * from employees`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

// CREATE employee
app.post("/api/employees", async (req, res, next) => {
  try {
    const SQL = /* sql */ `
            INSERT INTO employees(txt, department_id)
            VALUES($1, $2)
            RETURNING *
        `;
    const response = await client.query(SQL, [
      req.body.txt,
      req.body.department_id,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

// UPDATE employee
app.put("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = /* sql */ `
            UPDATE employees
            SET txt=$1, department_id=$2, updated_at=now()
            where id=$3
            RETURNING *
        `;
    const response = await client.query(SQL, [
      req.body.txt,
      req.body.department_id,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

//DELETE employee
app.delete("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `DELETE from employees WHERE id = $1`;
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

// handle errors
app.use((error, req, res, next) => {
  res.status(res.status || 500).send({ error: error });
});

const init = async () => {
  await client.connect();

  let SQL = /* sql */ `
    DROP TABLE IF EXISTS employees;
    DROP TABLE IF EXISTS departments;

    CREATE TABLE departments (
        id SERIAL PRIMARY KEY, 
        name VARCHAR(100) 
    );

    CREATE TABLE employees(
        id SERIAL PRIMARY KEY, 
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        txt VARCHAR(255) NOT NULL,
        department_id INTEGER REFERENCES departments(id) NOT NULL
    );
    `;

  await client.query(SQL);
  console.log("tables created");

  SQL = /* sql */ `
    INSERT INTO departments(name) VALUES('Dentist');
    INSERT INTO departments(name) VALUES('Dental Hygienist');
    INSERT INTO departments(name) VALUES('Dental Assistant');
    INSERT INTO departments(name) VALUES('Front Desk');

    INSERT INTO employees(txt, department_id) VALUES('Thi', (SELECT id FROM departments WHERE name='Dentist'));
    INSERT INTO employees(txt, department_id) VALUES('Michael', (SELECT id FROM departments WHERE name='Dentist'));
    INSERT INTO employees(txt, department_id) VALUES('Theresa', (SELECT id FROM departments WHERE name='Dentist'));
    INSERT INTO employees(txt, department_id) VALUES('Sharon', (SELECT id FROM departments WHERE name='Dental Hygienist'));
    INSERT INTO employees(txt, department_id) VALUES('Kawe', (SELECT id FROM departments WHERE name='Dental Hygienist'));
    INSERT INTO employees(txt, department_id) VALUES('Janelle', (SELECT id FROM departments WHERE name='Dental Hygienist'));
    INSERT INTO employees(txt, department_id) VALUES('Crystal', (SELECT id FROM departments WHERE name='Dental Assistant'));
    INSERT INTO employees(txt, department_id) VALUES('Araceli', (SELECT id FROM departments WHERE name='Dental Assistant'));
    INSERT INTO employees(txt, department_id) VALUES('Joyce', (SELECT id FROM departments WHERE name='Dental Assistant'));
    INSERT INTO employees(txt, department_id) VALUES('Jem', (SELECT id FROM departments WHERE name='Dental Assistant'));
    INSERT INTO employees(txt, department_id) VALUES('Jazzy', (SELECT id FROM departments WHERE name='Front Desk'));
    INSERT INTO employees(txt, department_id) VALUES('Amanda', (SELECT id FROM departments WHERE name='Front Desk'));
    INSERT INTO employees(txt, department_id) VALUES('Hallie', (SELECT id FROM departments WHERE name='Front Desk'));
    INSERT INTO employees(txt, department_id) VALUES('Christina', (SELECT id FROM departments WHERE name='Front Desk'));
    `;

  await client.query(SQL);
  console.log("data seeded");

  const port = process.env.PORT;
  app.listen(port, () => {
    console.log(`listening on ${port}`);
  });
};

init();
