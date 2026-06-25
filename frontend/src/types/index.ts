export interface AuthResponse {
  token: string;
  expiraEn: string;
  usuarioId: number;
  nombre: string;
  email: string;
  rol: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface ClienteDto {
  id: number;
  nombre: string;
  estadoCodigo: string;
  estadoNombre: string;
  contacto?: string;
  email?: string;
  telefono?: string;
  descripcion?: string;
  clasificaciones: ClasificacionDto[];
  subcuentas: SubcuentaDto[];
}

export interface ClasificacionDto {
  id: number;
  nombre: string;
}

export interface SubcuentaDto {
  id: number;
  nombre: string;
  clasificacionId?: number;
  clasificacionNombre?: string;
}

export interface ProyectoDto {
  id: number;
  nombre: string;
  clienteId: number;
  clienteNombre: string;
  subcuentaId?: number;
  subcuentaNombre?: string;
  estadoCodigo: string;
  estadoNombre: string;
  fechaInicio?: string;
  fechaFin?: string;
  descripcion?: string;
  ordenCompra?: OrdenCompraDto;
}

export interface OrdenCompraDto {
  id: number;
  numeroOc?: string;
  aQuienFacturar?: string;
  detalle?: string;
  montoTotal: number;
  monedaCodigo: string;
  monedaSimbolo: string;
}

export interface TicketDto {
  id: number;
  codigo: string;
  titulo: string;
  descripcion?: string;
  proyectoId: number;
  proyectoNombre: string;
  usuarioId?: number;
  usuarioNombre: string;
  prioridadCodigo: string;
  prioridadNombre: string;
  estadoCodigo: string;
  estadoNombre: string;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface UsuarioDto {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  perfilTrabajador?: PerfilTrabajadorDto;
}

export interface PerfilTrabajadorDto {
  id: number;
  formaPagoCodigo: string;
  formaPagoNombre: string;
  tarifaHora?: number;
  montoContrato?: number;
}

export interface ComentarioDto {
  id: number;
  texto: string;
  usuarioId: number;
  usuarioNombre: string;
  creadoEn: string;
}

export interface CatalogoDto {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
  orden: number;
}
