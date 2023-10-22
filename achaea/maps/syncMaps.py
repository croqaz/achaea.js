import json
import pathlib
import requests
from lxml import etree

CWD = pathlib.Path(__file__).parent.resolve()


def download_official_map():
    print("Downloading official map ...")
    r = requests.get("http://www.achaea.com/maps/map.xml")
    r.raise_for_status()
    with open(CWD / "official-map.xml", "wb") as fd:
        fd.write(r.content)
        print("Done.")


def process_official_map():
    print("Processing official map ...")
    maps = {}
    with open(CWD / "official-map.xml", "rb") as fd:
        xml = etree.XML(fd.read())
    for elem in xml:
        if not maps.get(elem.tag):
            maps[elem.tag] = {}

        if elem.tag == "areas":
            for child in elem:
                k, v = _xml_area_to_obj(child)
                if k and v:
                    maps[elem.tag][k] = v
        elif elem.tag == "environments":
            for child in elem:
                k, v = _xml_environ_to_obj(child)
                if k and v:
                    maps[elem.tag][k] = v
        elif elem.tag == "rooms":
            for child in elem:
                k, v = _xml_room_to_obj(child)
                if k and v:
                    maps[elem.tag][k] = v
        else:
            print("Don't know how to process:", elem.tag, "!")
    with open(CWD / "official-map.json", "w") as fd:
        json.dump(maps, fd, indent=2, sort_keys=True)
    print("Processed.")


def _xml_area_to_obj(elem):
    if not elem.attrib:
        return None, None
    attrs = dict(elem.attrib)
    area_id = int(attrs["id"])
    area_name = attrs["name"]
    return area_id, {"name": area_name}


def _xml_environ_to_obj(elem):
    if not elem.attrib:
        return None, None
    attrs = dict(elem.attrib)
    if attrs.get("x") == "0":
        del attrs["x"]
    if attrs.get("y") == "0":
        del attrs["y"]
    elem_id = int(attrs["id"])
    del attrs["id"]
    return elem_id, attrs


def _xml_room_to_obj(elem):
    if not elem.attrib:
        return None, None
    attrs = dict(elem.attrib)
    for child in elem:
        if child.tag == "coord":
            attrs["coord"] = {}
            for k, v in child.attrib.items():
                attrs["coord"][k] = int(v)
        elif child.tag == "exit":
            attrs.setdefault("exits", []).append(dict(child.attrib))
    elem_id = int(attrs["id"])
    del attrs["id"]
    return elem_id, attrs


def download_crowd_map():
    print("Downloading crowd map ...")
    r = requests.get("https://github.com/IRE-Mudlet-Mapping/AchaeaCrowdmap/raw/development/Map/map.json")
    r.raise_for_status()
    with open(CWD / "crowd-map-raw.json", "wb") as fd:
        fd.write(r.content)
        print("Done.")


def process_crowd_map():
    print("Processing crowd map ...")
    maps = {"areas": {}, "environments": {}}
    with open(CWD / "official-map.json", "r") as fd:
        official = json.load(fd)
        maps["environments"] = official["environments"]

    with open(CWD / "crowd-map-raw.json", "r") as fd:
        crowd = json.load(fd)
        for area in crowd["areas"]:
            if not area["rooms"]:
                continue
            area_id = area.pop("id")
            if len(area["rooms"]) == area["roomCount"]:
                del area["roomCount"]
            else:
                print(f'Area rooms != roomCount! {len(area["rooms"])} vs. {area["roomCount"]}!')
            # Try to fix the missing name
            if not area["name"]:
                off_area = official["areas"].get(str(area_id))
                if off_area:
                    area["name"] = off_area["name"]
            # Convert "rooms" from list to dict
            old_rooms = area.pop("rooms")
            area["rooms"] = {}
            for room in old_rooms:
                try:
                    del room["userData"]["Game Area"]
                except Exception:
                    pass
                old_coord = room.pop("coordinates")
                # Fix coords with X,Y,Z
                room["coord"] = {"x": old_coord[0], "y": old_coord[1], "z": old_coord[2]}
                area["rooms"][room.pop("id")] = room
            maps["areas"][area_id] = area

    with open(CWD / "crowd-map.json", "w") as fd:
        json.dump(maps, fd, indent=2, sort_keys=True)
    print("Processed.")


if __name__ == "__main__":
    download_official_map()
    process_official_map()
    download_crowd_map()
    process_crowd_map()
