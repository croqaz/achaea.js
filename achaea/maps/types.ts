export interface MapType {
  areas?: Record<string, MapArea>;
  environments?: Record<string, MapEnv>;
  rooms: Record<string, MapRoom>;
}

export interface MapArea {
  id?: string;
  name?: string;
  rooms: Record<string, MapRoom>;
  levels?: number[];
}

export interface MapEnv {
  name: string;
  color: string;
}

export interface MapRoom {
  id?: number;
  title: string;
  area: string;
  areaID?: string;
  environment: string;
  coord: any;
  exits: any[];
  visited: boolean;
  features: string[];
}

export interface GraphEdge {
  dir: string;
  cost: number;
}
