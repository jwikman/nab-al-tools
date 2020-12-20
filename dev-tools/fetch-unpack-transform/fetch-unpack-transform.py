#!/usr/bin/env python3

import os
import shutil
import requests
from typing import List, Dict
import zipfile
import re
import xml.etree.ElementTree as ET
import json
from sys import argv


# Update when needed
artifacts = ["https://bcartifacts.azureedge.net/onprem/17.1.18256.18474/se"]
TMP_DIR = "tmp"
XLF_DIR = os.path.join(TMP_DIR, "Translations")
field_caption_re = re.compile(r"Table \d* - Field \d* - Property 2879900210")

xlf_file_re = re.compile(
    r".*Base Application\.[a-z]{2}-[A-Z]{2}\.xlf",
    re.MULTILINE | re.IGNORECASE
)

language_source_zip_re = re.compile(
    r"Applications\\BaseApp\\Source\\.* language \(.*\).Source.zip",
    re.MULTILINE | re.IGNORECASE
)


def download_artifacts() -> List[str]:
    print("[*] Downloading file")
    global artifacts
    result: List[str] = []
    for i, url in enumerate(artifacts):
        out_file = f'{url.split("/")[-1]}.zip'
        result.append(out_file)
        with requests.get(url, stream=True) as req:
            req.raise_for_status()
            with open(out_file, 'wb') as f:
                for chunk in req.iter_content(chunk_size=8192):
                    f.write(chunk)
    return result


def extract_files(files: List[str]):
    print("[*] Extracting files")
    source_zips: List[str] = []
    for f in files:
        with zipfile.ZipFile(f, mode="r") as archive:
            for match in [z for z in archive.filelist if language_source_zip_re.match(z.filename)]:
                source_zips.append(match.filename)
                archive.extract(match, TMP_DIR)

    for source in source_zips:
        with zipfile.ZipFile(os.path.join(TMP_DIR, source), mode="r") as archive:
            for match in [z for z in archive.filelist if xlf_file_re.match(z.filename)]:
                archive.extract(match, TMP_DIR)


def add_to_dict(dictionary: Dict[str, List[str]], key: str, value: str) -> Dict[str, List[str]]:
    if key in dictionary:
        if not value in dictionary[key]:
            dictionary[key].append(value)
    elif value:
        dictionary[key] = [value]
    return dictionary


def parse_translations():
    xlf_files = os.listdir(XLF_DIR)
    xlf_files.sort()
    xlf_files = [f for f in xlf_files if f.endswith('.xlf')]
    for f in xlf_files:
        print("Parsing", f)
        tree = ET.parse(os.path.join(XLF_DIR, f))
        root = tree.getroot()
        translations: Dict[str, List[str]] = {}
        id_targets: Dict[str, List[str]] = {}
        for node in root:
            target_language = node.attrib['target-language']
            trans_unit_list = [
                trans_unit for trans_unit in node[0][0] if valid_tag(trans_unit)]

        for trans_unit in trans_unit_list:
            unit_id = trans_unit.attrib['id']
            source = trans_unit[0].text
            target = trans_unit[1].text

            translations = add_to_dict(translations, source, target)
            if field_caption_re.match(unit_id) is not None:
                id_targets = add_to_dict(id_targets, unit_id, target)

        out_dict = {**translations, **id_targets}
        out_path = os.path.join(XLF_DIR, f"{target_language.lower()}.json")
        with open(out_path, "w", encoding="utf8") as f:
            f.write(json.dumps(out_dict, ensure_ascii=False))


def valid_tag(tag) -> bool:
    if not tag:
        return False
    source = tag[0]
    target = tag[1]
    if not "source" in source.tag:
        return False
    if not source.text:
        return False
    if not "target" in target.tag:
        return False
    return True


def clean_up(files: List[str], directories: List[str]):
    for f in files:
        os.remove(f)
    for d in directories:
        shutil.rmtree(d)


if __name__ == "__main__":
    if len(argv) < 2:
        app_files = download_artifacts()
    else:
        app_files = [argv[1]]
    extract_files(app_files)
    parse_translations()
    if input("Completed. Continue with clean up? [Y/N]").upper() == "Y":
        clean_up(files=app_files, directories=[TMP_DIR])
