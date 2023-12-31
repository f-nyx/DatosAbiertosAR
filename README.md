# Proyecto Salv.AR

Este proyecto tiene como objetivo generar un archivo con todos los datos abiertos del Estado Argentino.

Desde hace años en diferentes sectores del Estado comenzaron a implementarse políticas de Datos Abiertos.
El nuevo gobierno declaró una guerra abierta contra el Estado, y no sabemos cuántas de estas iniciativas van
a desaparecer, y con ellas los datos que hoy son accesibles para la comunidad.

En esta época donde la información es poder, mantener un archivo colectivo de todos los datos disponibles es una
acción política fundamental. Este proyecto consiste en dos partes: un software que permite descargar masivamente
datos de todos los sectores del Estado, y un archivo histórico.

## Tabla de Contenidos

<!-- TOC -->
* [Proyecto Salv.AR](#proyecto-salvar)
  * [Cómo funciona](#cómo-funciona)
  * [Qué va a descargar](#qué-va-a-descargar)
  * [Distribución](#distribución)
  * [Cómo colaborar](#cómo-colaborar)
  * [Requisitos](#requisitos)
  * [Cómo usarlo](#cómo-usarlo)
    * [Configuración](#configuración)
<!-- TOC -->


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

* Nación
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
  * Ministerio de Producción - https://datos.produccion.gob.ar
  * PAMI - http://datos.pami.org.ar
  * Acumar - https://datos.acumar.gob.ar
  * Arsat - https://datos.arsat.com.ar
  * Cámara de Diputados - https://datos.hcdn.gob.ar
  * Otros Datos Abiertos - https://datos.gob.ar
  * Junta de Seguridad del Transporte - https://datos.jst.gob.ar
* Buenos Aires
  * Gobierno de la Provincia - https://catalogo.datos.gba.gob.ar
  * Luján - http://luj-bue-datos.paisdigital.innovacion.gob.ar
  * Tandil - http://datos.tandil.gov.ar
  * Tandil (Usina) - https://datos.usinatandil.com.ar
  * Pergamino - http://per-bue-datos.paisdigital.modernizacion.gob.ar
  * San Miguel - http://sme-bue-datos.paisdigital.modernizacion.gob.ar
  * Bahía Blanca - https://datos.bahia.gob.ar
* CABA - https://data.buenosaires.gob.ar
* Catamarca - http://datos.catamarca.gob.ar
* Chaco - https://datosabiertos.chaco.gob.ar
* Chubut
  * Comodoro - https://datos.vivamoscomodoro.gob.ar
  * Madryn (UNP) - http://pdts.mdn.unp.edu.ar
* Córdoba - https://datosestadistica.cba.gov.ar
* Corrientes - https://datos.ciudaddecorrientes.gov.ar
* Entre Rios - https://andino.entrerios.gov.ar
* Mendoza
  * Ciudad de Mendoza - https://ckan.ciudaddemendoza.gov.ar
  * Cámara de Diputados - http://datosabiertos.hcdmza.gob.ar
* Neuquén
  * Gobierno de la Provincia - http://datos.neuquen.gob.ar
  * Legislatura - https://datos.legislaturaneuquen.gob.ar
* San Juan - https://datosabiertos.sanjuan.gob.ar
* San Luis - http://slu-slu-datos.paisdigital.modernizacion.gob.ar
* Santa Fe
  * Gobierno de la Provincia - https://datos.santafe.gob.ar
  * Rafaela - http://datosabiertos.rafaela.gob.ar
  * Rosario (concejo) - http://datos.concejorosario.gov.ar
* Tucumán
  * Gobierno de la Provincia - https://sep.tucuman.gob.ar
  * Yerba Buena - http://datos.yerbabuena.gob.ar

## Distribución

En total son 50GB de datos descomprimidos, en su mayoría tablas de texto en formato CSV. Si alguien
quiere acceder a los datos directamente sin utilizar esta herramienta, vamos a distribuirlos de la
siguiente manera:

1. Todos los catálogos en formato JSON que genera esta herramienta están disponibles en el directorio `catalogs/`
  en este repositorio. Los catálogos contienen información sobre todos los datasets, con sus recursos, y las URL
  de descarga directa de cada recurso.
2. Subiremos todos los datasets comprimidos a [archive.org](https://archive.org), en esta colección:
  [DatosAbiertosAR](https://archive.org/details/DatosAbiertosAR).

## Cómo colaborar

Cosas que podés hacer:

* Encontrar más proveedores de datos y agregarlos [a la configuración](https://github.com/f-nyx/DatosAbiertosAR/blob/main/config.json).
* Descargar todos los datasets y seedear [el torrent de archive.org](https://archive.org/download/DatosAbiertosAR/DatosAbiertosAR_archive.torrent).
* Reportar problemas [creando un issue](https://github.com/f-nyx/DatosAbiertosAR/issues/new).
* Pedir que descarguemos datos abiertos específicos de alguna otra institución (también [creá un issue](https://github.com/f-nyx/DatosAbiertosAR/issues/new) para eso).

## Requisitos

* NodeJS 18 o superior
* 1 GB libre de memoria
* 100GB libres en disco (puede variar, esto es en la última actualización de este documento)
* Procesador Intel i5 o similar
* Una buena conexión a internet, 50mbps o 100mbps

## Cómo usarlo

1. Clonar este repositorio
2. Preparar el ambiente: `npm install` 
3. Correr la aplicación: `npm start -- --config-file config.json`
4. Esperar con mucha paciencia

De forma predeterminada, todo el contenido se descargará al directorio `out` dentro del directorio del proyecto.

### Configuración

El archivo de configuración permite especificar diferentes opciones que pueden ser útiles según el caso de uso.

```json
{
  "projectName": "salv.ar",
  "indexDir": "./out/meta/index",
  "storageDir": "./out/meta/files",
  "dataDir": "./out/data",
  "collectionsFile": "./out/meta/collections.json",
  "providers": [
    { 
      "name": "energia",
      "type": "ckan",
      "outputDir": "./nacion/energia",
      "options": {
        "apiUrl": "http://datos.energia.gob.ar",
        "jobs": 3,
        "retry": false
      }
    }
  ]
}
```

| Campo               | Descripción                                                                                                                |
|---------------------|----------------------------------------------------------------------------------------------------------------------------|
| projectName         | Nombre del proyecto de importación de datos.                                                                               |
| indexDir            | Directorio donde se escribirá el índice de recursos.                                                                       |
| storageDir          | Directorio donde se guardarán los archivos de los datasets.                                                                |
| dataDir             | Direcotrio donde se guardarán los datasets.                                                                                |
| providers           | Lista de proveedores desde los que se descargarán datos. Por el momento sólo soportamos proveedores CKAN.                  |
| providers.name      | Nombre del proveedor. Los datos de este proveedor se descargarán en un directorio con este nombre.                         |
| providers.type      | Tipo de proveedor. Por el momento sólo soportamos CKAN.                                                                    |
| providers.outputDir | Directorio donde se descargarán todos los datos de este proveedor.                                                         |
| providers.jobs      | Cantidad de tareas (descargas) en paralelo que se realizarán. Idealmente es cantidad de cores / 2 - 1, con un mínimo de 1. |
| providers.retry     | Indica si se reintentará procesar los recursos que no pudieron guardarse.                                                  |
