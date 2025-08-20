
export default () => {
    console.log(process.env.REDIS_PORT);
    console.log(process.env.REDIS_HOST);
    console.log(process.env.MONGODB_PORT);
    console.log(process.env.MONGODB_HOST);
    console.log(process.env.MONGODB_USER);
    console.log(process.env.MONGODB_PASSWORD);
    return {
        redis:{
            port: parseInt(process.env.REDIS_PORT!, 10) || 6379,
            host: process.env.REDIS_HOST!,
        },
        database :{
            port: parseInt(process.env.MONGODB_PORT!, 10) || 27017,
            host: process.env.MONGODB_HOST!,
            user: process.env.MONGODB_USER!,
            password: process.env.MONGODB_PASSWORD!,
        }
  };


}
  