export const buildTelegramStartUrl=(username:string,token:string)=>`https://t.me/${username}?start=${encodeURIComponent(token)}`;
