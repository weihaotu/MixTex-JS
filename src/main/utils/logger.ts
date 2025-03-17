const log = require('electron-log/main');

// 配置日志
const configureLogger = () => {
    // 捕获未处理的异常和Promise rejection
    process.on('uncaughtException', (error) => {
        log.error('Uncaught Exception:', error);
    });

    process.on('unhandledRejection', (reason) => {
        log.error('Unhandled Promise Rejection:', reason);
    });

    return log;
};

export const logger = configureLogger();

// 导出配置好的logger实例
export default logger; 