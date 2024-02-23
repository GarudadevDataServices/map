import { useCallback, useEffect, useRef, useState } from 'react';
import * as mapApi from 'apis/api';
import ClipLoader from 'react-spinners/ClipLoader';
import { useSearchParams } from 'next/navigation';
import { FunctionData, MapColorData, PageData, StringOrNumber } from 'models/model';
import Header from '~/components/widgets/Header';
import L, { PathOptions } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './css/style.css';
import {IconPointer, IconPointerFilled} from '@tabler/icons-react';


interface pageJsonStates {
  title: string;
  desc: string;
  metatitle: string;
}



export default function Page() {
  const [result, setResult] = useState<string>();
  const [titleDesc, setTitleDesc] = useState<pageJsonStates>({ title: '', desc: '', metatitle:'' });

  const searchParams = useSearchParams();
  const colorData = useRef<MapColorData | null>(null);
  const geojsonData = useRef<Map<String,any>|null>(null);
  const mapContainer = useRef<L.Map>();
  const stateLayer = useRef<L.GeoJSON>();
  const lastClickedLayer = useRef<L.GeoJSON>();
  const tapped = useRef<boolean>(false);
  const checkedLayer = useRef<L.GeoJSON>();

  

  const onEachFeature = useCallback((feature: GeoJSON.Feature, layer: L.GeoJSON)=>{
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
      if (lastClickedLayer.current!=null) {
        stateLayer.current!.resetStyle(lastClickedLayer.current);
      }
      lastClickedLayer.current = layer;
      checkedLayer.current = layer;
      layer.setStyle(highlightStyle);
      showResult(output, _color);
    });
  },[]);

  function style(feature?: GeoJSON.Feature): PathOptions {
    const key: StringOrNumber = (feature?.properties as any)[colorData.current!.trigger];
    const border = (colorData.current!.border == null) ? null : colorData.current!.border.split(",");

    if (colorData.current != null) {
      return {
        fillColor: ((colorData.current.data as any)[key] == null) ? 'snow' : (colorData.current.data as any)[key].color,
        weight: (border == null) ? 0.3 : border[0] as any,
        opacity: (border == null) ? 0.85 : border[1] as any,
        color: 'black',
        fillOpacity: .8,
      }
    }
    return {}
  }

  // creating function flow
  const reStyleMap = useCallback(async (url: string) =>{
    await mapApi.getColorData(url as RequestInfo).then(
      async (_colorData) => {
        colorData.current = _colorData;
        tapped.current=false;
        checkedLayer.current=undefined;
        stateLayer.current!.clearLayers();
        stateLayer.current = L.geoJSON(geojsonData.current as any, { style: style, onEachFeature: onEachFeature });
        stateLayer.current.addTo(mapContainer.current!);
      });
  },[onEachFeature]);

  const load_data_freq = useCallback((time: string, link: string)=>{
    console.log("calling data again");
    setTimeout(() => {
      reStyleMap(link);
      load_data_freq(time, link);
    }, parseInt(time) * 1000);
  },[reStyleMap])

  const createFunction = useCallback((functionData: FunctionData)=>{
    console.log("creating function")
    if (functionData.name == "load_data_freq") {
      const args = functionData.args.split(",");
      load_data_freq(args[0], args[1]);
    }
  },[load_data_freq]);


  useEffect(() => {
    const path = searchParams.get('map') ?? 'ap2019asm';
    console.log(`Getting data for ${path}`)

    function initilizeMap(_geojsonData: any):void {
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
                title: _colorData.title, desc: _colorData.desc, metatitle: data.title
              });
              colorData.current = _colorData;
              geojsonData.current = _geoJsonData;
              initilizeMap(_geoJsonData);
            }
          );
  
        }
      )
    }

    loadInitialData(path);
  }, [searchParams, onEachFeature, createFunction]);
  

  // state change functions
  function showResult(_html: string, _color: string) {
    setResult(`<div style='background-color:${_color};' class='h-full w-full text-[16px] text-center p-2 overflow-auto font-mono'>${_html}</div>`);
  }

  return (
    <div className='flex flex-col w-full h-full'>      
      {(titleDesc.title!=='')?<title>{titleDesc.metatitle}</title>:<div/>}
      <Header title={titleDesc.title} className='!h-[50px] !text-center' />
      <div className='flex-1 flex md:flex-row flex-col flex-grow  w-full'>
        <div className='w-full md:w-3/4 h-full'>
          <div id='map' className='flex items-center justify-center pl-1 pb-1 border-l-black min-w-[75vw] min-h-[calc(100vh-380px)] w-full h-full overflow-clip !bg-slate-50'>
            {(titleDesc.title=='')?<ClipLoader color='red'/>:<div/>}
          </div>
        </div>
        <div className='flex md:flex-col w-full md:h-full h-[320px]'>
          {(result!==undefined)?<div dangerouslySetInnerHTML={{ __html: result }} className='h-[320px] md:h-[calc(100vh-370px)] w-full bg-green-300'/>:
            <div className='h-[320px] md:h-[calc(100vh-370px)] w-full bg-green-300 text-xs font-mono text-center flex flex-col items-center justify-center'>
              {(titleDesc.title=='')?<div/>:<><IconPointer /> Move Cursor on Map <br/> to view this section</>}
            </div>}
          <div className='flex w-full h-[320px] overflow-auto bg-amber-100'>
            <div dangerouslySetInnerHTML={{ __html: titleDesc.desc }} className='p-2 w-full text-[16px] flex justify-center text-center overflow-auto' />
          </div>
          </div>
      </div>
    </div>
  );
}