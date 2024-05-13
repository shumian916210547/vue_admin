import { utils } from "xlsx";

/**
 * 
 * @param {string} name 表格名称
 * @param {array} columns 表头
 * @param {array} columnData 表数据 
 * 
 * */

export class Sheet {
    constructor(name, columns, columnData) {
        this.name = name;
        this.columns = columns;
        this.columnData = columnData;
        this.sheetData = [columns, ...columnData]
        this.ws = utils.aoa_to_sheet(this.sheetData);

        // 计算并设置列宽
        const wscols = columns.map(() => new Object({ wch: 30 }))
        // 遍历数据并调整列宽
        this.sheetData.forEach((row) => {
            row.forEach((cell, colIndex) => {
                const cellLength = String(cell).length;
                if (!wscols[colIndex] || cellLength > wscols[colIndex].wch) {
                    wscols[colIndex] = { wch: cellLength };
                }
            });
        });
        // 将列宽应用到工作表
        this.ws['!cols'] = wscols;


        this.wb = utils.book_new();
        utils.book_append_sheet(this.wb, this.ws, this.name);
    }
}