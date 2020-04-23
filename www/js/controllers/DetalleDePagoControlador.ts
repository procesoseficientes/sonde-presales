﻿class DetalleDePagoControlador {
  tokenPago: SubscriptionToken;
  documentoDePago: PagoDeFacturaVencidaEncabezado;
  configuracionDeDecimales: ManejoDeDecimales;
  simboloDeMoneda: string;

  constructor(public mensajero: Messenger) {
    this.tokenPago = mensajero.subscribe<PagoDeFacturaVencidaMensaje>(
      this.pagoEntregado,
      getType(PagoDeFacturaVencidaMensaje),
      this
    );
  }

  delegarDetalleDePagoControlador(): void {
    $("#UiPaymentDetailPage").on("pageshow", (e: JQueryEventObject) => {
      e.preventDefault();
      this.cargarDatosPrincipales();
    });

    $("#UiBtnBackFromPaymentDetailPage").on("click", (e: JQueryEventObject) => {
      e.preventDefault();
      this.regresarAPantallaAnterior();
    });
  }

  regresarAPantallaAnterior(): void {
    window.history.back();
    this.documentoDePago = new PagoDeFacturaVencidaEncabezado();
  }

  pagoEntregado(mensaje: PagoDeFacturaVencidaMensaje, subscriber: any): void {
    subscriber.documentoDePago = mensaje.pago;
    subscriber.configuracionDeDecimales = mensaje.configuracionDeDecimales;
    subscriber.simboloDeMoneda = mensaje.simboloDeMoneda;
  }

  cargarDatosPrincipales(): void {
    InteraccionConUsuarioServicio.bloquearPantalla();

    let etiquetaDeInformacionDeCliente = $("#UiLblCustomerInfo");
    etiquetaDeInformacionDeCliente.text(
      `${this.documentoDePago.codeCustomer} - ${this.documentoDePago.nameCustomer}`
    );
    etiquetaDeInformacionDeCliente = null;

    let etiquetaDeInformacionDelPago = $("#UiLblPaymentAmountInfo");
    etiquetaDeInformacionDelPago.text(
      `Recibo No. ${this.documentoDePago.docNum} (${
        this.configuracionDeDecimales.currencySymbol
      }. ${format_number(
        this.documentoDePago.paymentAmount,
        this.configuracionDeDecimales.defaultDisplayDecimals
      )})`
    );
    etiquetaDeInformacionDelPago = null;

    this.construirVisualizacionDeDetalleDeFacturasCanceladas(
      this.documentoDePago,
      () => {
        InteraccionConUsuarioServicio.desbloquearPantalla();
      }
    );
  }

  construirVisualizacionDeDetalleDeFacturasCanceladas(
    documentoDePago: PagoDeFacturaVencidaEncabezado,
    callback: () => void
  ): void {
    try {
      let contenedorDeDetalleDePago = $("#UiListOfInvoicesPaid");
      contenedorDeDetalleDePago.children().remove("li");

      let cadenaHtmlDeDetalleDocumentosDePago: string[] = [];

      documentoDePago.overdueInvoicePaymentDetail.forEach(
        (detalle: PagoDeFacturaVencidaDetalle) => {
          cadenaHtmlDeDetalleDocumentosDePago.push(` <li data-icon="false">`);
          cadenaHtmlDeDetalleDocumentosDePago.push(` <a href="#">`);
          cadenaHtmlDeDetalleDocumentosDePago.push(
            ` <label>No. ${detalle.invoiceId} </label>`
          );
          cadenaHtmlDeDetalleDocumentosDePago.push(
            ` <label>Vencimiento: ${
              detalle.dueDate.toString().split(" ")[0]
            } </label>`
          );
          cadenaHtmlDeDetalleDocumentosDePago.push(
            ` <label>Emisión: ${
              detalle.createdDate.toString().split(" ")[0]
            } </label>`
          );
          cadenaHtmlDeDetalleDocumentosDePago.push(
            ` <label>Saldo: ${
              this.configuracionDeDecimales.currencySymbol
            }. ${format_number(
              detalle.pendingToPaid,
              this.configuracionDeDecimales.defaultDisplayDecimals
            )} </label>`
          );
          cadenaHtmlDeDetalleDocumentosDePago.push(
            ` <span class="ui-li-count">${
              this.configuracionDeDecimales.currencySymbol
            }. ${format_number(
              detalle.payedAmount,
              this.configuracionDeDecimales.defaultDisplayDecimals
            )}</span>`
          );
          cadenaHtmlDeDetalleDocumentosDePago.push(` </a>`);
          cadenaHtmlDeDetalleDocumentosDePago.push(` </li>`);
        }
      );

      let listadoDePagos: string = cadenaHtmlDeDetalleDocumentosDePago.join("");
      if (listadoDePagos !== "") {
        contenedorDeDetalleDePago.append(listadoDePagos);
        contenedorDeDetalleDePago.listview("refresh");
      }
    } catch (e) {
      notify(
        `Ha ocurrido un error al crear el listado de detalle del documento de pago, por favor, vuelva a intentar.`
      );
    }

    callback();
  }
}
