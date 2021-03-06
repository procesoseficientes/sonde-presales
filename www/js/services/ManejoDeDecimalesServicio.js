var ManejoDeDecimalesServicio = (function () {
    function ManejoDeDecimalesServicio() {
    }
    ManejoDeDecimalesServicio.prototype.obtenerInformacionDeManejoDeDecimales = function (callback, callbackError) {
        var decimales = new ManejoDeDecimales();
        decimales.defaultCalculationsDecimals = parseInt(localStorage.getItem("DEFAULT_CALCULATIONS_DECIMALS"));
        decimales.defaultDisplayDecimals = parseInt(localStorage.getItem("DEFAULT_DISPLAY_DECIMALS"));
        decimales.displayDecimalsRoundConfiguration = localStorage.getItem("DISPLAY_DECIMALS_ROUND_CONFIGURATION");
        decimales.displayDecimalsRoundType = localStorage.getItem("DISPLAY_DECIMALS_ROUND_TYPE");
        decimales.currencySymbol =
            localStorage.getItem("DISPLAY_SYMBOL_CURRENCY") || "Q";
        callback(decimales);
    };
    ManejoDeDecimalesServicio.prototype.calcularPorTipoDecimales = function (manejoDeDecimales, valor) {
        var resultadoValor = 0;
        switch (manejoDeDecimales.displayDecimalsRoundType) {
            case "TRUNC":
                resultadoValor = format_number(valor, 0);
                break;
            case "ROUND":
                resultadoValor = Math.round(valor);
                break;
            case "FLOOR":
                resultadoValor = Math.floor(valor);
                break;
            case "CEILING":
                resultadoValor = Math.ceil(valor);
                break;
            default:
                resultadoValor = trunc_number(valor, manejoDeDecimales.defaultCalculationsDecimals);
                break;
        }
        return resultadoValor;
    };
    return ManejoDeDecimalesServicio;
}());
//# sourceMappingURL=ManejoDeDecimalesServicio.js.map