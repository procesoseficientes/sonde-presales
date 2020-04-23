﻿class TomaDeInventarioServicio implements ITomaDeInventarioServicio {
    
    insertarTomaDeInventario(tomaInventario: TomaInventario, callback: () => void, callbackError: (resultado: Operacion) => void): void {
        SONDA_DB_Session.transaction(
        (tx) => {
            var sql = this.obtenerFormatoSqlDeInsertarTomaDeInventarioEncabezado(tomaInventario);
            tx.executeSql(sql);
            var i: number;
            for (i = 0; i < tomaInventario.tomaInventarioDetalle.length; i++) {
                sql = this.obtenerFormatoSqlDeInsertarTomaDeInventarioDetalle(tomaInventario.tomaInventarioDetalle[i]);
                tx.executeSql(sql);
            }
            callback();
        }, (err: SqlError) => {
            callbackError(<Operacion>{
                codigo: -1,
                mensaje: "Error al insertar orden de venta: " + err.message
            });
        });
    }

    obtenerFormatoSqlDeInsertarTomaDeInventarioEncabezado(tomaInventario: TomaInventario): string {
        let sql = new Array<string>();
        sql.push("INSERT INTO TAKE_INVENTORY_HEADER (");
        sql.push("TAKE_INVENTORY_ID");
        sql.push(", POSTED_DATETIME");
        sql.push(", CLIENT_ID");
        sql.push(", CODE_ROUTE");
        sql.push(", GPS_URL");
        sql.push(", POSTED_BY");
        sql.push(", DEVICE_BATERY_FACTOR");
        sql.push(", IS_ACTIVE_ROUTE");
        sql.push(", GPS_EXPECTED");
        sql.push(", TAKE_INVENTORY_ID_BO");
        sql.push(", DOC_SERIE");
        sql.push(", DOC_NUM");
        sql.push(", IS_VOID");
        sql.push(", TASK_ID");
        sql.push(", IS_POSTED");
        sql.push(",DEVICE_NETWORK_TYPE");
        sql.push(",IS_POSTED_OFFLINE");
        sql.push(") VALUES(");
        sql.push(`${tomaInventario.takeInventoryId}`);
        sql.push(`,'${tomaInventario.postedDataTime}'`);
        sql.push(`,'${tomaInventario.clientId}'`);
        sql.push(`,'${tomaInventario.codeRoute}'`);
        sql.push(`,'${tomaInventario.gpsUrl}'`);
        sql.push(`,'${tomaInventario.postedBy}'`);
        sql.push(`,'${tomaInventario.deviceBatteryFactor}'`);
        sql.push(`,${tomaInventario.isActiveRoute}`);
        sql.push(`,'${tomaInventario.gpsExpected}'`);
        sql.push(`,${tomaInventario.takeInventoryIdBo}`);
        sql.push(`,'${tomaInventario.docSerie}'`);
        sql.push(`,${tomaInventario.docNum}`);
        sql.push(`,${tomaInventario.isVoid ? 1 : 0}`);
        sql.push(`,${tomaInventario.taskId}`);
        sql.push(`,${tomaInventario.isPosted}`);
        sql.push(`,'${tipoDeRedALaQueEstaConectadoElDispositivo}'`);
        sql.push(`,${(gIsOnline === SiNo.Si ? 0 : 1)}`);
        sql.push(");");
        return sql.join("");
    }

    obtenerFormatoSqlDeInsertarTomaDeInventarioDetalle(tomaInventarioDetalle: TomaInventarioDetalle): string {
        let sql = new Array<string>();
        sql.push("INSERT INTO TAKE_INVENTORY_DETAIL (TAKE_INVENTORY_ID,CODE_SKU,QTY,CODE_PACK_UNIT,LAST_QTY) VALUES(");
        sql.push(`${tomaInventarioDetalle.takeInventoryId}`);
        sql.push(`,'${tomaInventarioDetalle.codeSku}'`);
        sql.push(`,${tomaInventarioDetalle.qty}`);
        sql.push(`,'${tomaInventarioDetalle.codePackUnit}'`);
        sql.push(`,${tomaInventarioDetalle.lastQty}`);
        sql.push(");");
        return sql.join("");
    }


    obtenerTomaDeInventarioPorTarea(tarea: Tarea, decimales: ManejoDeDecimales, callback: (tomaDeInventario: TomaInventario) => void, errCallBack: (resultado: Operacion) => void) {
        SONDA_DB_Session.transaction(
            (tx) => {
                var sql = "SELECT ";
                sql += "  H.TAKE_INVENTORY_ID";
                sql += ", H.POSTED_DATETIME";
                sql += ", H.GPS_URL";
                sql += " , C.CLIENT_NAME ";
                sql += " , C.ADDRESS ";
                sql += " , C.PHONE ";
                sql += " , C.CONTACT_CUSTOMER ";
                sql += ", H.DOC_SERIE";
                sql += ", H.DOC_NUM";
                sql += " FROM CLIENTS C";
                sql += " INNER JOIN TAKE_INVENTORY_HEADER H ON (C.CLIENT_ID = H.CLIENT_ID) ";
                sql += " WHERE H.TASK_ID = " + tarea.taskId;
                sql += " AND IS_VOID = 0 ";

                tx.executeSql(sql, [],
                    (tx: SqlTransaction, results: SqlResultSet) => {
                        if (results.rows.length >= 1) {

                            var tomaDeInventarioTemp: any = results.rows.item(0);
                            var tomaDeInventario = new TomaInventario();
                            tomaDeInventario.takeInventoryId = tomaDeInventarioTemp.TAKE_INVENTORY_ID;
                            tomaDeInventario.postedDataTime = tomaDeInventarioTemp.POSTED_DATETIME;
                            tomaDeInventario.gpsUrl = tomaDeInventarioTemp.GPS_URL;
                            tomaDeInventario.clientName = tomaDeInventarioTemp.CLIENT_NAME;
                            tomaDeInventario.docSerie = tomaDeInventarioTemp.DOC_SERIE;
                            tomaDeInventario.docNum = tomaDeInventarioTemp.DOC_NUM;

                            this.obtenerTomaDeInventarioDetalle(tomaDeInventario, decimales, (tomaDeInventario: TomaInventario) => {
                                callback(tomaDeInventario);
                            }, (resultado: Operacion) => {
                                errCallBack(resultado);
                            });

                        } else {
                            var tomaDeInventarioNew = new TomaInventario();
                            tomaDeInventarioNew.tomaInventarioDetalle = [];
                            callback(tomaDeInventarioNew);
                        }
                    });
            },
            (err: SqlError) => {
                errCallBack(<Operacion>{ codigo: -1, mensaje: "Error al obtener la toma de inventario: " + err.message });
            }
        );
    }

    obtenerTomaDeInventarioDetalle(tomaDeInventario: TomaInventario, decimales: ManejoDeDecimales, callback: (tomaDeInventario: TomaInventario) => void, errCallBack: (resultado: Operacion) => void) {
        SONDA_DB_Session.transaction(
            (tx) => {
                var sql = " SELECT ";
                sql += " D.CODE_SKU ";
                sql += " , IFNULL(MAX(S.SKU_NAME),'PENDIENTE DE APROBACION') SKU_NAME";
                sql += " , SUM(D.QTY) QTY";
                sql += " , SUM(D.LAST_QTY) LAST_QTY";
                sql += " , D.CODE_PACK_UNIT";
                sql += " FROM TAKE_INVENTORY_HEADER H";
                sql += " INNER JOIN TAKE_INVENTORY_DETAIL D ON (H.TAKE_INVENTORY_ID = D.TAKE_INVENTORY_ID)";
                sql += " LEFT JOIN SKU_PRESALE S ON (S.SKU = D.CODE_SKU)";
                sql += " WHERE H.TAKE_INVENTORY_ID = " + tomaDeInventario.takeInventoryId;
                sql += " AND H.DOC_SERIE = '" + tomaDeInventario.docSerie + "'";
                sql += " AND H.DOC_NUM = " + tomaDeInventario.docNum;
                sql += " GROUP BY D.CODE_SKU, D.CODE_PACK_UNIT";


                tx.executeSql(sql, [],
                    (tx: SqlTransaction, results: SqlResultSet) => {
                        if (results.rows.length >= 1) {
                            tomaDeInventario.tomaInventarioDetalle = [];
                            for (var i = 0; i < results.rows.length; i++) {
                                var detalleTemp: any = results.rows.item(i);
                                var tomaDeInventarioDetalle = new TomaInventarioDetalle();
                                tomaDeInventarioDetalle.codeSku = detalleTemp.CODE_SKU;
                                tomaDeInventarioDetalle.skuName = detalleTemp.SKU_NAME;
                                tomaDeInventarioDetalle.qty = trunc_number(detalleTemp.QTY, decimales.defaultCalculationsDecimals);
                                tomaDeInventarioDetalle.lastQty = trunc_number(detalleTemp.LAST_QTY, decimales.defaultCalculationsDecimals);
                                tomaDeInventarioDetalle.codePackUnit = detalleTemp.CODE_PACK_UNIT;
                                tomaDeInventario.tomaInventarioDetalle.push(tomaDeInventarioDetalle);
                            }
                            callback(tomaDeInventario);
                        } else {
                            errCallBack(<Operacion>{ codigo: -1, mensaje: "Error no se encontraron detalles de la toma de iventario." });
                        }
                    });
            },
            (err: SqlError) => {
                errCallBack(<Operacion>{ codigo: -1, mensaje: "Error al obtener la toma de inventario: " + err.message });
            }
        );
    }

}
