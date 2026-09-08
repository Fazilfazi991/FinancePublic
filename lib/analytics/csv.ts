export function csvCell(value:unknown){let text=String(value??'');if(/^[=+\-@\t\r]/.test(text))text=`'${text}`;return `"${text.replace(/"/g,'""')}"`}
export function csv(columns:string[],rows:unknown[][]){return [columns.map(csvCell).join(','),...rows.map(row=>row.map(csvCell).join(','))].join('\r\n')}
