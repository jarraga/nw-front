# NW Front

## Requisitos

- Node.js 22
- npm
- Docker, solo para levantar la version productiva en contenedor

## Variables de entorno

Revisar el archivo `.env.development` existente para desarrollo local:

```env
VITE_API_URL=http://localhost:8080
```

En Vite, las variables `VITE_*` se leen al momento de build.

## Instalar dependencias

```bash
npm install
```

## Levantar en desarrollo

```bash
npm run dev
```

La app queda disponible en la URL que informe Vite en la terminal.

## Generar build local

```bash
npm run build
```

El build se genera en la carpeta `dist`.

## Levantar build productivo con Docker

Construir la imagen:

```bash
npm run docker:build
```

Levantar el contenedor:

```bash
npm run docker:run
```

La app queda disponible en:

```text
http://localhost:3000
```

Para cambiar la URL del backend en el build Docker:

```bash
docker build --build-arg VITE_API_URL=http://localhost:8080 -t nw-front .
```
