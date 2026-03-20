const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const errorMiddleware = require('./middlewares/error.middleware');
const sprintsRoutes = require('./routes/sprints.routes');
const tareasRoutes = require('./routes/tareas.routes');
const evaluacionesRoutes = require('./routes/evaluaciones.routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    ok: true,
    message: 'Backend funcionando correctamente'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/sprints', sprintsRoutes);
app.use('/api/tareas', tareasRoutes);
app.use('/api/evaluaciones', evaluacionesRoutes);

app.use(errorMiddleware);

module.exports = app;