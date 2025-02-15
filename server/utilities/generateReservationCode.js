const generateReservationCode = () => {
    const length = 10
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; // Pool of valid characters
    let result = '';
  
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result = result + characters[randomIndex];
    }
  
    return result;
};


module.exports = { generateReservationCode };
