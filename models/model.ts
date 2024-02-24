import { LatLngExpression } from "leaflet";

export type StringOrNumber = string|number;

export interface PageData {
    data:string;
    map: string;
    title: string;
}

export interface MapColorData {
    data: Map<StringOrNumber,SegmentColorData>;
    desc: string;
    title: string;
    trigger: string;
    search_trigger?: string;
    bound?: LatLngExpression[];
    border?: string;
    function?: FunctionData;
}

export interface SegmentColorData {
    color: string;
    matter: string;
}

export interface FunctionData {
    args: string;
    name: string;
}