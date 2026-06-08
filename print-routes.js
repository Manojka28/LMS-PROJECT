import express from 'express';
import certificateRoutes from './server/routes/certificate.js';

const app = express();
app.use('/api/certificate', certificateRoutes);

function printRoutes(app) {
  app._router.stack.forEach((middleware) => {
    if (middleware.route) { // routes registered directly on the app
      console.log(middleware.route.path);
    } else if (middleware.name === 'router') { // router middleware 
      middleware.handle.stack.forEach((handler) => {
        let route;
        if (handler.route) {
          route = handler.route;
        }
        if (route) {
          console.log('/api/certificate' + route.path);
        }
      });
    }
  });
}

printRoutes(app);
process.exit(0);
