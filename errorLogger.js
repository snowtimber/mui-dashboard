import fs from 'fs';
import path from 'path';

const logFilePath = path.join(process.cwd(), 'error.json');

const errorLogger = {
  log: (error) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    };

    fs.appendFile(logFilePath, JSON.stringify(errorData) + '\n', (err) => {
      if (err) {
        console.error('Error writing to log file:', err);
      }
    });
  },
};

process.on('uncaughtException', (error) => {
  errorLogger.log(error);
});

process.on('unhandledRejection', (reason) => {
  errorLogger.log(reason);
});

export default errorLogger;