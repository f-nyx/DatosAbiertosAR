# Proyecto Salv.AR

Este proyecto tiene como objetivo generar un archivo con todos los datos abiertos del Estado Argentino.

Desde hace años en diferentes sectores del Estado comenzaron a implementarse políticas de Datos Abiertos.
El nuevo gobierno declaró una guerra abierta contra el Estado, y no sabemos cuántas de estas iniciativas van
a desaparecer, y con ellas los datos que hoy son accesibles para la comunidad.

En esta época donde la información es poder, mantener un archivo colectivo de todos los datos disponibles es una
acción política fundamental. Este proyecto consiste en dos partes: un software que permite descargar masivamente
datos de todos los sectores del Estado, y un archivo histórico.

## Cómo funciona

CKAN es una tecnología libre para publicar datos abiertos que se adoptó ampliamente en distintos sectores
del Estado. CKAN permite clasificar y publicar __datasets__, y provee un sitio donde cualquier persona puede
buscar y explorar estos __datasets__. Muchos sitios de datos del Estado como [datos.gob.ar](https://datos.gob.ar)
(por dar un ejemplo) están construidos con esta tecnología.

CKAN provee un catálogo público que se puede consultar a través de una API REST. El catálogo contiene toda la lista
de __datasets__ y de recursos en cada __dataset__. Los recursos tienen una url de descarga. Este software permite
descargar todos los datasets de un sitio de CKAN, y funciona incrementalmente, es decir, sólo descargará los datasets
que fueron modificados desde la última vez que corrió la aplicación.

## Qué va a descargar

A los sitios de datos abiertos le llamamos __proveedores__. El archivo de configuración de la aplicación permite
configurar diferentes proveedores solamente especificando la url. Por el momento, la aplicación descargará todos
los datasets de los siguientes proveedores:

* Enargas - https://transparencia.enargas.gov.ar
* Secretaría de Energía - http://datos.energia.gob.ar
* Ministerio del Interior - https://datos.mininterior.gob.ar
* Ministerio de Justicia - http://datos.jus.gob.ar
* Ministerio de Ciencia y Tecnología - https://datasets.datos.mincyt.gob.ar
* Ministerio de Salud - http://datos.salud.gob.ar
* Ministerio de Transporte - https://datos.transporte.gob.ar
* Ministerio de Turismo y Deportes - https://datos.yvera.gob.ar
* Ministerio de Agricultura, Ganadería y Pesca - https://datos.magyp.gob.ar
* Ministerio de Cultura - https://datos.cultura.gob.ar
* Ministerio de Defensa - http://datos.mindef.gov.ar
* Ministerio de Desarrollo Social - https://datosabiertos.desarrollosocial.gob.ar
* Ministerio de Producción (caido) - http://estadisticas.produccion.gob.ar/app
* PAMI - http://datos.pami.org.ar
* Acumar - https://datos.acumar.gob.ar
* Arsat - https://datos.arsat.com.ar
* Otros Datos Abiertos - https://datos.gob.ar

## Distribución

En total son 50GB de datos descomprimidos, en su mayoría tablas de texto en formato CSV. Si alguien
quiere acceder a los datos directamente sin utilizar esta herramienta, vamos a distribuirlos de la
siguiente manera:

1. Todos los catálogos en formato JSON que genera esta herramienta están disponibles en el directorio `catalogs/`
  en este repositorio. Los catálogos contienen información sobre todos los datasets, con sus recursos, y las URL
  de descarga directa de cada recurso.
2. Subiremos todos los datasets comprimidos a [archive.org](https://archive.org), en esta colección:
  [DatosAbiertosAr](https://archive.org/details/DatosAbiertosAR).

## Requisitos

* NodeJS 18 o superior
* 1 GB libre de memoria
* 50GB libres en disco (puede variar, esto es en la última actualización de este documento)
* Procesador Intel i5 o similar
* Una buena conexión a internet, 50mbps o 100mbps

## Cómo usarlo

1. Clonar este repositorio
2. Correr la aplicación: `npm start -- --config-file config.json`
3. Esperar con mucha paciencia

De forma predeterminada, todo el contenido se descargará al directorio `out` dentro del directorio del proyecto.

### Configuración

El archivo de configuración permite especificar diferentes opciones que pueden ser útiles según el caso de uso.

```json
{
  "projectName": "salv.ar",
  "outputDir": "./out",
  "providers": [
    { 
      "name": "energia",
      "type": "ckan",
      "options": {
        "apiUrl": "http://datos.energia.gob.ar",
        "jobs": 3,
        "retry": false
      }
    }
  ]
}
```

| Campo           | Descripción                                                                                                                |
|-----------------|----------------------------------------------------------------------------------------------------------------------------|
| projectName     | Nombre del proyecto de importación de datos.                                                                               |
| outputDir       | Directorio donde se descargarán todos los datos.                                                                           |
| providers       | Lista de proveedores desde los que se descargarán datos. Por el momento sólo soportamos proveedores CKAN.                  |
| providers.name  | Nombre del proveedor. Los datos de este proveedor se descargarán en un directorio con este nombre.                         |
| providers.type  | Tipo de proveedor. Por el momento sólo soportamos CKAN.                                                                    |
| providers.jobs  | Cantidad de tareas (descargas) en paralelo que se realizarán. Idealmente es cantidad de cores / 2 - 1, con un mínimo de 1. |
| providers.retry | Indica si se reintentará procesar los recursos que no pudieron guardarse.                                                  |
