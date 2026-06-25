namespace Oviq.Domain.Common;

public abstract class BaseEntity
{
    public int Id { get; set; }
    public DateTime CreadoEn { get; set; }
    public int? CreadoPorId { get; set; }
    public DateTime? ModificadoEn { get; set; }
    public int? ModificadoPorId { get; set; }
}
