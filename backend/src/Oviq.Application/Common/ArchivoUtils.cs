namespace Oviq.Application.Common;

// Borrado de archivos subidos por el usuario (ej. Factura.ArchivoUrl) — valida
// que la ruta resuelta caiga dentro de wwwroot antes de tocar el sistema de
// archivos, para que un ArchivoUrl corrupto o manipulado nunca pueda borrar
// algo fuera de esa carpeta.
public static class ArchivoUtils
{
    public static void EliminarArchivoSeguro(string? archivoUrl)
    {
        if (string.IsNullOrWhiteSpace(archivoUrl))
            return;

        var wwwroot = Path.GetFullPath(
            Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"));
        var rutaArchivo = Path.GetFullPath(
            Path.Combine(wwwroot, archivoUrl.TrimStart('/', '\\')));

        var prefijoWwwroot = wwwroot.TrimEnd(
            Path.DirectorySeparatorChar,
            Path.AltDirectorySeparatorChar) + Path.DirectorySeparatorChar;

        if (!rutaArchivo.StartsWith(prefijoWwwroot, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException(
                $"La ruta del archivo no es válida: {archivoUrl}");

        if (File.Exists(rutaArchivo))
            File.Delete(rutaArchivo);
    }
}
