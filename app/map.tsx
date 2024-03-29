import { useCallback, useEffect, useRef, useState } from 'react';
import * as mapApi from 'apis/api';
import ClipLoader from 'react-spinners/ClipLoader';
import { useSearchParams } from 'next/navigation';
import { FunctionData, MapColorData, StringOrNumber } from 'models/model';
import Header from '~/components/widgets/Header';
import L, { PathOptions } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './css/style.css';
import { IconPointer } from '@tabler/icons-react';
import ReactSearchBox from "react-search-box";


interface pageJsonStates {
  title: string;
  desc: string;
  metatitle: string;
  search_trigger?: string;
}

export default function Page() {
  const [result, setResult] = useState<string>();
  const [titleDesc, setTitleDesc] = useState<pageJsonStates>({ title: '', desc: '', metatitle: '', search_trigger: undefined });

  const searchParams = useSearchParams();
  const colorData = useRef<MapColorData | null>(null);
  const geojsonData = useRef<Map<String, any> | null>(null);
  const mapContainer = useRef<L.Map>();
  const stateLayer = useRef<L.GeoJSON>();
  const lastClickedLayer = useRef<L.GeoJSON>();
  const tapped = useRef<boolean>(false);
  const checkedLayer = useRef<L.GeoJSON>();



  const onEachFeature = useCallback((feature: GeoJSON.Feature, layer: L.GeoJSON) => {
    if (colorData.current == null) { return; }

    const trigger: StringOrNumber = (feature?.properties as any)[colorData.current.trigger];
    if ((colorData.current.data as any)[trigger] == null) {
      return;
    }

    let highlightStyle = {
      weight: 3,
      opacity: 1,
      color: 'red',
      fillOpacity: .8
    };

    const selectedData = (colorData.current.data as any)[trigger];
    let output = selectedData["matter"];
    let _color = selectedData["color"];

    layer.on("mouseover", function (e) {
      if (tapped.current) { return; }
      if (lastClickedLayer.current) {
        stateLayer.current!.resetStyle(lastClickedLayer.current);
      }
      lastClickedLayer.current = layer;
      layer.setStyle(highlightStyle);
      showResult(output, _color);
    });

    layer.on("click", function (e) {
      console.log("cliked");
      if ((checkedLayer.current == layer)) { // TODO : add this logic : &&($(window).width()>=992)
        stateLayer.current!.resetStyle(checkedLayer.current);
        checkedLayer.current = undefined;
        tapped.current = false;
        return;
      }
      tapped.current = true;
      if (lastClickedLayer.current != null) {
        stateLayer.current!.resetStyle(lastClickedLayer.current);
      }
      lastClickedLayer.current = layer;
      checkedLayer.current = layer;
      layer.setStyle(highlightStyle);
      showResult(output, _color);
    });
  }, []);

  function style(feature?: GeoJSON.Feature): PathOptions {
    const key: StringOrNumber = (feature?.properties as any)[colorData.current!.trigger];
    const border = (colorData.current!.border == null) ? null : colorData.current!.border.split(",");

    if (colorData.current != null) {
      return {
        fillColor: ((colorData.current.data as any)[key] == null) ? 'snow' : (colorData.current.data as any)[key].color,
        weight: (border == null) ? 0.5 : border[0] as any,
        opacity: (border == null) ? 0.5 : border[1] as any,
        color: 'black',
        fillOpacity: .8,
      }
    }
    return {}
  }

  // creating function flow
  const reStyleMap = useCallback(async (url: string) => {
    await mapApi.getColorData(url as RequestInfo).then(
      async (_colorData) => {
        colorData.current = _colorData;
        tapped.current = false;
        checkedLayer.current = undefined;
        stateLayer.current!.clearLayers();
        stateLayer.current = L.geoJSON(geojsonData.current as any, { style: style, onEachFeature: onEachFeature });
        stateLayer.current.addTo(mapContainer.current!);
      });
  }, [onEachFeature]);

  const load_data_freq = useCallback((time: string, link: string) => {
    console.log("calling data again");
    setTimeout(() => {
      reStyleMap(link);
      load_data_freq(time, link);
    }, parseInt(time) * 1000);
  }, [reStyleMap])

  const createFunction = useCallback((functionData: FunctionData) => {
    console.log("creating function")
    if (functionData.name == "load_data_freq") {
      const args = functionData.args.split(",");
      load_data_freq(args[0], args[1]);
    }
  }, [load_data_freq]);


  useEffect(() => {
    const path = searchParams.get('map') ?? 'ap2019asm';
    console.log(`Getting data for ${path}`)

    function initilizeMap(_geojsonData: any): void {
      const mbUrl = 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZGF0dGEwNyIsImEiOiJja3A2dHRrajEyN3JwMnZtd2ZtZTZnYzB4In0.i89VhIgx3UVvpTffewpr4Q';
      const layers = { 'Google-Maps': L.tileLayer(mbUrl, { id: 'mapbox/outdoors-v11', tileSize: 512, zoomOffset: -1 }), 'Satellite': L.tileLayer(mbUrl, { id: 'mapbox/satellite-v9', tileSize: 512, zoomOffset: -1 }), 'Satellite-Label': L.tileLayer(mbUrl, { id: 'mapbox/satellite-streets-v11', tileSize: 512, zoomOffset: -1 }), 'Streets': L.tileLayer(mbUrl, { id: 'mapbox/streets-v11', tileSize: 512, zoomOffset: -1 }), 'Navigation-day': L.tileLayer(mbUrl, { id: 'mapbox/navigation-day-v1', tileSize: 512, zoomOffset: -1 }), 'Navigation-night': L.tileLayer(mbUrl, { id: 'mapbox/navigation-night-v1', tileSize: 512, zoomOffset: -1 }), 'Light': L.tileLayer(mbUrl, { id: 'mapbox/light-v10', tileSize: 512, zoomOffset: -1 }), 'Dark': L.tileLayer(mbUrl, { id: 'mapbox/dark-v10', tileSize: 512, zoomOffset: -1 }), 'OpenStreetMap': L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'), "None": L.tileLayer("") };

      mapContainer.current = L.map('map', { zoomControl: false, attributionControl: false });
      mapContainer.current.setView([51.505, -0.09], 13);

      stateLayer.current = L.geoJSON(_geojsonData, { style: style, onEachFeature: onEachFeature });
      stateLayer.current.addTo(mapContainer.current);

      if (colorData.current!.bound != null) {
        mapContainer.current.fitBounds(L.latLngBounds(colorData.current!.bound));
      }
      else {
        mapContainer.current.fitBounds(stateLayer.current.getBounds());
      }

      L.control.layers(layers).addTo(mapContainer.current);

      if (colorData.current!.function != null) {
        createFunction(colorData.current!.function)
      }
    }

    function loadInitialData(path: string) {
      mapApi.getPageData(path).then(
        async (data) => {
          mapApi.getColorData(data?.data as RequestInfo).then(
            async (_colorData) => {
              const _geoJsonData = await mapApi.getJsonResponseFromUrl(data?.map as RequestInfo);
              setTitleDesc({
                title: _colorData.title, desc: _colorData.desc, metatitle: data.title, search_trigger: _colorData.search_trigger
              });
              colorData.current = _colorData;
              geojsonData.current = _geoJsonData;
              initilizeMap(_geoJsonData);
            }
          );

        }
      )
    }

    // return () => loadInitialData(path); // for local
    loadInitialData(path); // for prod
  }, [searchParams, onEachFeature, createFunction]);


  // state change functions
  function showResult(_html: string, _color: string) {
    setResult(`<div style='background-color:${_color};' class='h-full w-full text-[16px] text-center p-2 overflow-auto font-mono'>${_html}</div>`);
  }

  const onSearchFeature = useCallback((layer: L.GeoJSON, trigger: StringOrNumber) => {
    if (colorData.current == null) { return; }

    // const trigger: StringOrNumber = (feature?.properties as any)[colorData.current.trigger];
    if ((colorData.current.data as any)[trigger] == null) {
      return;
    }

    let highlightStyle = {
      weight: 3,
      opacity: 1,
      color: 'red',
      fillOpacity: .8
    };

    const selectedData = (colorData.current.data as any)[trigger];
    let output = selectedData["matter"];
    let _color = selectedData["color"];

    tapped.current = true;
    if (lastClickedLayer.current != null) {
      stateLayer.current!.resetStyle(lastClickedLayer.current);
    }
    lastClickedLayer.current = layer;
    checkedLayer.current = layer;
    layer.setStyle(highlightStyle);
    showResult(output, _color);
    mapContainer.current?.fitBounds(layer.getBounds());
  }, []);

  function SearchBar() {
    let arr: { key: string, value: string }[] = [];

    if (stateLayer.current) {
      const trigger = colorData.current!.trigger;
      stateLayer.current!.eachLayer(function (layer) {
        const feature = ((layer as any).feature as GeoJSON.Feature)
        arr.push(
          {
            key: (feature.properties as any)[trigger],
            value: (feature.properties as any)[titleDesc.search_trigger!]
          }

        );
      })
    }
    return <ReactSearchBox
      inputHeight='40px'
      inputFontSize='18px'
      placeholder="Search..."
      data={arr}
      // onSelect={(record: any) => console.log(record)}
      onChange={() => { }}
      onSelect={(value) => {
        console.log("the tapped is", value.item.key)
        const _trigger = colorData.current!.trigger;
        const _layer = stateLayer.current!.getLayers().find((layer) => {
          const _feature = ((layer as any).feature as GeoJSON.Feature);
          // console.log((_feature.properties as any)[_trigger],value.item.key,(_feature.properties as any)[_trigger]===value.item.key);
          return (_feature.properties as any)[_trigger] === value.item.key;
        })
        // console.log(_layer)
        onSearchFeature(_layer as any, value.item.key)

      }}
      autoFocus={false}
      leftIcon={<>🔍</>}
      iconBoxSize="48px"
    />
  }

  return (
    <div className='flex flex-col w-full h-full'>
      {(titleDesc.title !== '') ? <title>{titleDesc.metatitle}</title> : <div />}
      <Header title={titleDesc.title} className='!h-[50px] !text-center' />
      <div className='flex-1 flex md:flex-row flex-col flex-grow  w-full'>
        <div className='w-full md:w-3/4 h-full'>
          <div id='map' className='flex items-center justify-center pl-1 pb-1 border-l-black min-w-[75vw] min-h-[calc(100vh-380px)] w-full h-full overflow-clip !bg-slate-50'>
            {(titleDesc.title == '') ? <ClipLoader color='red' /> : <div />}
          </div>
        </div>
        
        <div className='bg-pink-300 flex md:flex-col md:w-full md:h-[calc(100vh-50px)] h-[320px]'>
          <div className='h-[320px] md:h-[50%] w-[50vw] md:w-full'>
            {(result !== undefined) ? 
            <div dangerouslySetInnerHTML={{ __html: result }} className='h-full w-full bg-green-300' /> :
            <div className='h-full w-full bg-green-300 text-xs font-mono text-center flex flex-col items-center justify-center'>
              {(titleDesc.title == '') ? <div /> : <><IconPointer /> Move Cursor on Map <br /> to view this section</>}
            </div>}
          </div>
          

          <div className='w-[50vw] md:w-full h-[320px] md:h-[50%] '>
            <div className='w-full h-full flex flex-col overflow-auto bg-amber-100'>
              {(!!titleDesc.search_trigger) ? <div className='h-[40px] w-full z-20'>
                <SearchBar /></div> : <></>}
              <div dangerouslySetInnerHTML={{ __html: titleDesc.desc }} className='p-2 w-full text-[16px] flex justify-center text-center overflow-auto' />
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}