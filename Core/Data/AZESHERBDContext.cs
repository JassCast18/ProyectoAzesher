
#nullable disable
using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Core.Models;

namespace Core.Data;

public partial class AZESHERBDContext : DbContext
{
    public AZESHERBDContext(DbContextOptions<AZESHERBDContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Abono> Abonos { get; set; }

    public virtual DbSet<Bitacora> Bitacoras { get; set; }

    public virtual DbSet<Cliente> Clientes { get; set; }

    public virtual DbSet<Compra> Compras { get; set; }

    public virtual DbSet<CuentaCobrar> CuentaCobrars { get; set; }

    public virtual DbSet<DetalleCompra> DetalleCompras { get; set; }

    public virtual DbSet<DetalleTraslado> DetalleTraslados { get; set; }

    public virtual DbSet<DetalleVentum> DetalleVenta { get; set; }

    public virtual DbSet<Factura> Facturas { get; set; }

    public virtual DbSet<Inventario> Inventarios { get; set; }

    public virtual DbSet<Producto> Productos { get; set; }

    public virtual DbSet<Proveedor> Proveedors { get; set; }

    public virtual DbSet<Recibo> Recibos { get; set; }

    public virtual DbSet<SesionCaja> SesionCajas { get; set; }

    public virtual DbSet<Sucursal> Sucursals { get; set; }

    public virtual DbSet<Traslado> Traslados { get; set; }

    public virtual DbSet<Usuario> Usuarios { get; set; }

    public virtual DbSet<Vendedor> Vendedors { get; set; }

    public virtual DbSet<Ventum> Venta { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Abono>(entity =>
        {
            entity.HasKey(e => e.IdAbono).HasName("PK__abono__1E6B958391629EC0");

            entity.ToTable("abono");

            entity.HasIndex(e => e.IdCuenta, "idx_abono_cuenta");

            entity.Property(e => e.IdAbono).HasColumnName("id_abono");
            entity.Property(e => e.Fecha)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("fecha");
            entity.Property(e => e.IdCuenta).HasColumnName("id_cuenta");
            entity.Property(e => e.Monto)
                .HasColumnType("decimal(12, 2)")
                .HasColumnName("monto");

            entity.HasOne(d => d.IdCuentaNavigation).WithMany(p => p.Abonos)
                .HasForeignKey(d => d.IdCuenta)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_abono_cuenta");
        });

        modelBuilder.Entity<Bitacora>(entity =>
        {
            entity.HasKey(e => e.IdBitacora).HasName("PK__bitacora__7E4268B0CE8CDC57");

            entity.ToTable("bitacora");

            entity.HasIndex(e => e.IdUsuario, "idx_bitacora_usuario");

            entity.Property(e => e.IdBitacora).HasColumnName("id_bitacora");
            entity.Property(e => e.Accion)
                .IsRequired()
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("accion");
            entity.Property(e => e.Fecha)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("fecha");
            entity.Property(e => e.IdUsuario).HasColumnName("id_usuario");

            entity.HasOne(d => d.IdUsuarioNavigation).WithMany(p => p.Bitacoras)
                .HasForeignKey(d => d.IdUsuario)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_bitacora_usuario");
        });

        modelBuilder.Entity<Cliente>(entity =>
        {
            entity.HasKey(e => e.IdCliente).HasName("PK__cliente__677F38F5B48A82AC");

            entity.ToTable("cliente");

            entity.HasIndex(e => e.Nit, "idx_cliente_nit");

            entity.HasIndex(e => e.Nombre, "idx_cliente_nombre");

            entity.Property(e => e.IdCliente).HasColumnName("id_cliente");
            entity.Property(e => e.Direccion)
                .IsUnicode(false)
                .HasColumnName("direccion");
            entity.Property(e => e.Nit)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("nit");
            entity.Property(e => e.Nombre)
                .IsRequired()
                .HasMaxLength(150)
                .IsUnicode(false)
                .HasColumnName("nombre");
            entity.Property(e => e.Telefono)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("telefono");
        });

        modelBuilder.Entity<Compra>(entity =>
        {
            entity.HasKey(e => e.IdCompra).HasName("PK__compra__C4BAA6045F864BFA");

            entity.ToTable("compra");

            entity.HasIndex(e => e.IdProveedor, "idx_compra_proveedor");

            entity.Property(e => e.IdCompra).HasColumnName("id_compra");
            entity.Property(e => e.Fecha)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("fecha");
            entity.Property(e => e.IdProveedor).HasColumnName("id_proveedor");
            entity.Property(e => e.Total)
                .HasColumnType("decimal(12, 2)")
                .HasColumnName("total");

            entity.HasOne(d => d.IdProveedorNavigation).WithMany(p => p.Compras)
                .HasForeignKey(d => d.IdProveedor)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_compra_proveedor");
        });

        modelBuilder.Entity<CuentaCobrar>(entity =>
        {
            entity.HasKey(e => e.IdCuenta).HasName("PK__cuenta_c__C7E28685394A43CC");

            entity.ToTable("cuenta_cobrar");

            entity.HasIndex(e => e.IdVenta, "idx_cuenta_cobrar_venta");

            entity.Property(e => e.IdCuenta).HasColumnName("id_cuenta");
            entity.Property(e => e.Estado)
                .IsRequired()
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("estado");
            entity.Property(e => e.IdVenta).HasColumnName("id_venta");
            entity.Property(e => e.SaldoPendiente)
                .HasColumnType("decimal(12, 2)")
                .HasColumnName("saldo_pendiente");

            entity.HasOne(d => d.IdVentaNavigation).WithMany(p => p.CuentaCobrars)
                .HasForeignKey(d => d.IdVenta)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_cuenta_cobrar_venta");
        });

        modelBuilder.Entity<DetalleCompra>(entity =>
        {
            entity.HasKey(e => e.IdDetalleCompra).HasName("PK__detalle___BD16E279D8D26E3D");

            entity.ToTable("detalle_compra");

            entity.HasIndex(e => e.IdCompra, "idx_dc_compra_fk");

            entity.HasIndex(e => e.IdProducto, "idx_dc_producto_fk");

            entity.Property(e => e.IdDetalleCompra).HasColumnName("id_detalle_compra");
            entity.Property(e => e.Cantidad).HasColumnName("cantidad");
            entity.Property(e => e.CostoUnitario)
                .HasColumnType("decimal(12, 2)")
                .HasColumnName("costo_unitario");
            entity.Property(e => e.IdCompra).HasColumnName("id_compra");
            entity.Property(e => e.IdProducto).HasColumnName("id_producto");
            entity.Property(e => e.Subtotal)
                .HasColumnType("decimal(12, 2)")
                .HasColumnName("subtotal");

            entity.HasOne(d => d.IdCompraNavigation).WithMany(p => p.DetalleCompras)
                .HasForeignKey(d => d.IdCompra)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_dc_compra");

            entity.HasOne(d => d.IdProductoNavigation).WithMany(p => p.DetalleCompras)
                .HasForeignKey(d => d.IdProducto)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_dc_producto");
        });

        modelBuilder.Entity<DetalleTraslado>(entity =>
        {
            entity.HasKey(e => e.IdDetalleTraslado).HasName("PK__detalle___B6CC4955EEB92918");

            entity.ToTable("detalle_traslado");

            entity.HasIndex(e => e.IdProducto, "idx_dt_producto_fk");

            entity.HasIndex(e => e.IdTraslado, "idx_dt_traslado_fk");

            entity.Property(e => e.IdDetalleTraslado).HasColumnName("id_detalle_traslado");
            entity.Property(e => e.Cantidad).HasColumnName("cantidad");
            entity.Property(e => e.IdProducto).HasColumnName("id_producto");
            entity.Property(e => e.IdTraslado).HasColumnName("id_traslado");

            entity.HasOne(d => d.IdProductoNavigation).WithMany(p => p.DetalleTraslados)
                .HasForeignKey(d => d.IdProducto)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_dt_producto");

            entity.HasOne(d => d.IdTrasladoNavigation).WithMany(p => p.DetalleTraslados)
                .HasForeignKey(d => d.IdTraslado)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_dt_traslado");
        });

        modelBuilder.Entity<DetalleVentum>(entity =>
        {
            entity.HasKey(e => e.IdDetalle).HasName("PK__detalle___4F1332DE077DE1A9");

            entity.ToTable("detalle_venta");

            entity.HasIndex(e => e.IdProducto, "idx_dv_producto_fk");

            entity.HasIndex(e => e.IdVenta, "idx_dv_venta_fk");

            entity.Property(e => e.IdDetalle).HasColumnName("id_detalle");
            entity.Property(e => e.Cantidad).HasColumnName("cantidad");
            entity.Property(e => e.IdProducto).HasColumnName("id_producto");
            entity.Property(e => e.IdVenta).HasColumnName("id_venta");
            entity.Property(e => e.PrecioUnitario)
                .HasColumnType("decimal(12, 2)")
                .HasColumnName("precio_unitario");
            entity.Property(e => e.Subtotal)
                .HasColumnType("decimal(12, 2)")
                .HasColumnName("subtotal");

            entity.HasOne(d => d.IdProductoNavigation).WithMany(p => p.DetalleVenta)
                .HasForeignKey(d => d.IdProducto)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_dv_producto");

            entity.HasOne(d => d.IdVentaNavigation).WithMany(p => p.DetalleVenta)
                .HasForeignKey(d => d.IdVenta)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_dv_venta");
        });

        modelBuilder.Entity<Factura>(entity =>
        {
            entity.HasKey(e => e.IdFactura).HasName("PK__factura__6C08ED539A3A5C26");

            entity.ToTable("factura");

            entity.HasIndex(e => e.NumeroFactura, "UQ__factura__3DC4B241E525C550").IsUnique();

            entity.HasIndex(e => e.IdVenta, "idx_factura_venta");

            entity.Property(e => e.IdFactura).HasColumnName("id_factura");
            entity.Property(e => e.Estado)
                .IsRequired()
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("estado");
            entity.Property(e => e.FechaEmision)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("fecha_emision");
            entity.Property(e => e.IdVenta).HasColumnName("id_venta");
            entity.Property(e => e.NumeroFactura)
                .IsRequired()
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("numero_factura");
            entity.Property(e => e.Total)
                .HasColumnType("decimal(12, 2)")
                .HasColumnName("total");

            entity.HasOne(d => d.IdVentaNavigation).WithMany(p => p.Facturas)
                .HasForeignKey(d => d.IdVenta)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_factura_venta");
        });

        modelBuilder.Entity<Inventario>(entity =>
        {
            entity.HasKey(e => e.IdInventario).HasName("PK__inventar__013AEB519ABCDD3B");

            entity.ToTable("inventario");

            entity.HasIndex(e => e.IdProducto, "idx_inventario_producto");

            entity.HasIndex(e => e.IdSucursal, "idx_inventario_sucursal");

            entity.Property(e => e.IdInventario).HasColumnName("id_inventario");
            entity.Property(e => e.IdProducto).HasColumnName("id_producto");
            entity.Property(e => e.IdSucursal).HasColumnName("id_sucursal");
            entity.Property(e => e.Stock).HasColumnName("stock");

            entity.HasOne(d => d.IdProductoNavigation).WithMany(p => p.Inventarios)
                .HasForeignKey(d => d.IdProducto)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_inventario_producto");

            entity.HasOne(d => d.IdSucursalNavigation).WithMany(p => p.Inventarios)
                .HasForeignKey(d => d.IdSucursal)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_inventario_sucursal");
        });

        modelBuilder.Entity<Producto>(entity =>
        {
            entity.HasKey(e => e.IdProducto).HasName("PK__producto__FF341C0D2DA016B3");

            entity.ToTable("producto");

            entity.HasIndex(e => e.Nombre, "idx_producto_nombre");

            entity.Property(e => e.IdProducto).HasColumnName("id_producto");
            entity.Property(e => e.Descripcion)
                .IsUnicode(false)
                .HasColumnName("descripcion");
            entity.Property(e => e.Nombre)
                .IsRequired()
                .HasMaxLength(150)
                .IsUnicode(false)
                .HasColumnName("nombre");
            entity.Property(e => e.Precio)
                .HasColumnType("decimal(12, 2)")
                .HasColumnName("precio");
        });

        modelBuilder.Entity<Proveedor>(entity =>
        {
            entity.HasKey(e => e.IdProveedor).HasName("PK__proveedo__8D3DFE28F0820AAC");

            entity.ToTable("proveedor");

            entity.HasIndex(e => e.Nombre, "idx_proveedor_nombre");

            entity.Property(e => e.IdProveedor).HasColumnName("id_proveedor");
            entity.Property(e => e.Direccion)
                .IsUnicode(false)
                .HasColumnName("direccion");
            entity.Property(e => e.Nombre)
                .IsRequired()
                .HasMaxLength(150)
                .IsUnicode(false)
                .HasColumnName("nombre");
            entity.Property(e => e.Telefono)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("telefono");
        });

        modelBuilder.Entity<Recibo>(entity =>
        {
            entity.HasKey(e => e.IdRecibo).HasName("PK__recibo__1F2CC1BAF81F41F8");

            entity.ToTable("recibo");

            entity.HasIndex(e => e.NumeroRecibo, "UQ__recibo__401C1A817005D9AE").IsUnique();

            entity.HasIndex(e => e.IdFactura, "idx_recibo_factura");

            entity.Property(e => e.IdRecibo).HasColumnName("id_recibo");
            entity.Property(e => e.FechaPago)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("fecha_pago");
            entity.Property(e => e.IdFactura).HasColumnName("id_factura");
            entity.Property(e => e.MetodoPago)
                .IsRequired()
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("metodo_pago");
            entity.Property(e => e.Monto)
                .HasColumnType("decimal(12, 2)")
                .HasColumnName("monto");
            entity.Property(e => e.NumeroComprobante)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("numero_comprobante");
            entity.Property(e => e.NumeroRecibo)
                .IsRequired()
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("numero_recibo");

            entity.HasOne(d => d.IdFacturaNavigation).WithMany(p => p.Recibos)
                .HasForeignKey(d => d.IdFactura)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_recibo_factura");
        });

        modelBuilder.Entity<SesionCaja>(entity =>
        {
            entity.HasKey(e => e.IdSesion).HasName("PK__sesion_c__8D3F9DFE41B4C61F");

            entity.ToTable("sesion_caja");

            entity.HasIndex(e => e.IdUsuario, "idx_sesion_caja_usuario");

            entity.Property(e => e.IdSesion).HasColumnName("id_sesion");
            entity.Property(e => e.FechaApertura)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("fecha_apertura");
            entity.Property(e => e.FechaCierre)
                .HasColumnType("datetime")
                .HasColumnName("fecha_cierre");
            entity.Property(e => e.IdUsuario).HasColumnName("id_usuario");
            entity.Property(e => e.MontoCierre)
                .HasColumnType("decimal(12, 2)")
                .HasColumnName("monto_cierre");

            entity.HasOne(d => d.IdUsuarioNavigation).WithMany(p => p.SesionCajas)
                .HasForeignKey(d => d.IdUsuario)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_sesion_caja_usuario");
        });

        modelBuilder.Entity<Sucursal>(entity =>
        {
            entity.HasKey(e => e.IdSucursal).HasName("PK__sucursal__4C758013BC9F1FD7");

            entity.ToTable("sucursal");

            entity.HasIndex(e => e.Nombre, "idx_sucursal_nombre");

            entity.Property(e => e.IdSucursal).HasColumnName("id_sucursal");
            entity.Property(e => e.Direccion)
                .IsUnicode(false)
                .HasColumnName("direccion");
            entity.Property(e => e.Nombre)
                .IsRequired()
                .HasMaxLength(150)
                .IsUnicode(false)
                .HasColumnName("nombre");
            entity.Property(e => e.Telefono)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("telefono");
        });

        modelBuilder.Entity<Traslado>(entity =>
        {
            entity.HasKey(e => e.IdTraslado).HasName("PK__traslado__3E65EDDDD861AC57");

            entity.ToTable("traslado");

            entity.HasIndex(e => e.IdSucursalDestino, "idx_traslado_destino");

            entity.HasIndex(e => e.IdSucursalOrigen, "idx_traslado_origen");

            entity.Property(e => e.IdTraslado).HasColumnName("id_traslado");
            entity.Property(e => e.Estado)
                .IsRequired()
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("estado");
            entity.Property(e => e.Fecha)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("fecha");
            entity.Property(e => e.IdSucursalDestino).HasColumnName("id_sucursal_destino");
            entity.Property(e => e.IdSucursalOrigen).HasColumnName("id_sucursal_origen");

            entity.HasOne(d => d.IdSucursalDestinoNavigation).WithMany(p => p.TrasladoIdSucursalDestinoNavigations)
                .HasForeignKey(d => d.IdSucursalDestino)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_traslado_destino");

            entity.HasOne(d => d.IdSucursalOrigenNavigation).WithMany(p => p.TrasladoIdSucursalOrigenNavigations)
                .HasForeignKey(d => d.IdSucursalOrigen)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_traslado_origen");
        });

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.HasKey(e => e.IdUsuario).HasName("PK__usuario__4E3E04AD77604EC3");

            entity.ToTable("usuario");

            entity.HasIndex(e => e.Username, "UQ__usuario__F3DBC57222F785BF").IsUnique();

            entity.HasIndex(e => e.IdSucursal, "idx_usuario_sucursal");

            entity.HasIndex(e => e.Username, "idx_usuario_username");

            entity.Property(e => e.IdUsuario).HasColumnName("id_usuario");
            entity.Property(e => e.IdSucursal).HasColumnName("id_sucursal");
            entity.Property(e => e.Nombre)
                .IsRequired()
                .HasMaxLength(150)
                .IsUnicode(false)
                .HasColumnName("nombre");
            entity.Property(e => e.Password)
                .IsRequired()
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("password");
            entity.Property(e => e.Rol)
                .IsRequired()
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("rol");
            entity.Property(e => e.Username)
                .IsRequired()
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("username");

            entity.HasOne(d => d.IdSucursalNavigation).WithMany(p => p.Usuarios)
                .HasForeignKey(d => d.IdSucursal)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_usuario_sucursal");
        });

        modelBuilder.Entity<Vendedor>(entity =>
        {
            entity.HasKey(e => e.IdVendedor).HasName("PK__vendedor__00930308F882614A");

            entity.ToTable("vendedor");

            entity.HasIndex(e => e.Nombre, "idx_vendedor_nombre");

            entity.Property(e => e.IdVendedor).HasColumnName("id_vendedor");
            entity.Property(e => e.Nombre)
                .IsRequired()
                .HasMaxLength(150)
                .IsUnicode(false)
                .HasColumnName("nombre");
            entity.Property(e => e.Telefono)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("telefono");
        });

        modelBuilder.Entity<Ventum>(entity =>
        {
            entity.HasKey(e => e.IdVenta).HasName("PK__venta__459533BFC490E84B");

            entity.ToTable("venta");

            entity.HasIndex(e => e.IdCliente, "idx_venta_cliente");

            entity.HasIndex(e => e.IdSesion, "idx_venta_sesion");

            entity.HasIndex(e => e.IdVendedor, "idx_venta_vendedor");

            entity.Property(e => e.IdVenta).HasColumnName("id_venta");
            entity.Property(e => e.Fecha)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("fecha");
            entity.Property(e => e.IdCliente).HasColumnName("id_cliente");
            entity.Property(e => e.IdSesion).HasColumnName("id_sesion");
            entity.Property(e => e.IdVendedor).HasColumnName("id_vendedor");
            entity.Property(e => e.TipoPago)
                .IsRequired()
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("tipo_pago");
            entity.Property(e => e.Total)
                .HasColumnType("decimal(12, 2)")
                .HasColumnName("total");

            entity.HasOne(d => d.IdClienteNavigation).WithMany(p => p.Venta)
                .HasForeignKey(d => d.IdCliente)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_venta_cliente");

            entity.HasOne(d => d.IdSesionNavigation).WithMany(p => p.Venta)
                .HasForeignKey(d => d.IdSesion)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_venta_sesion");

            entity.HasOne(d => d.IdVendedorNavigation).WithMany(p => p.Venta)
                .HasForeignKey(d => d.IdVendedor)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_venta_vendedor");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}