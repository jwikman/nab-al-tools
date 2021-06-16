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
APP_VERSION = "18.0.23013.23795"
ARTIFACTS_URL = f"https://bcartifacts.azureedge.net/onprem/{APP_VERSION}/se"
KNOWN_LANGUAGES = [
    "cs-cz",
    "da-dk",
    "de-at",
    "de-ch",
    "de-de",
    "en-au",
    "en-ca",
    "en-gb",
    "en-nz",
    "en-us",
    "es-es_tradnl",
    "es-mx",
    "fi-fi",
    "fr-be",
    "fr-ca",
    "fr-ch",
    "fr-fr",
    "is-is",
    "it-ch",
    "it-it",
    "nb-no",
    "nl-be",
    "nl-nl",
    "ru-ru",
    "sv-se"
]

CURRENT_DIR = os.path.dirname(os.path.realpath(__file__))
TMP_DIR = os.path.join(CURRENT_DIR, "tmp")
XLF_DIR = os.path.join(TMP_DIR, "Translations")
field_caption_re = re.compile(r"Table \d* - Field \d* - Property 2879900210")

xlf_file_re = re.compile(
    r".*Base Application\.[a-z]{2}-[A-Z]{2}\.xlf",
    re.MULTILINE | re.IGNORECASE
)

language_source_zip_re = re.compile(
    r"Applications(\\|\/)BaseApp(\\|\/)Source(\\|\/).* language \(.*\).Source.zip",
    re.MULTILINE | re.IGNORECASE
)


def download_artifacts(url: str) -> List[str]:
    print("[*] Downloading file")
    result: List[str] = []
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
            print(f"[*] Extracting: \"{archive.filename}\"")
            for match in [z for z in archive.filelist if language_source_zip_re.match(z.filename)]:
                print(f"Found: {match.filename}")
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
        print("Parsing...", f)
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
        check_known_languages(target_language)
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


def create_temp_folders(tmp_dir: str, xlf_dir: str):
    if not os.path.exists(tmp_dir):
        os.mkdir(tmp_dir)
    if not os.path.exists(xlf_dir):
        os.mkdir(xlf_dir)


def check_known_languages(lang_code: str):
    global KNOWN_LANGUAGES
    if lang_code.lower() not in KNOWN_LANGUAGES:
        print(
            f"[*] New language: {lang_code}. Make sure to update affected files e.g BaseAppTranslationFiles.ts")


if __name__ == "__main__":
    create_temp_folders(TMP_DIR, XLF_DIR)
    if len(argv) < 2:
        app_files = download_artifacts(ARTIFACTS_URL)
    else:
        app_files = [argv[1]]
    extract_files(app_files)
    parse_translations()
    if input("[!] Completed. Continue with clean up? [Y/N]").upper() == "Y":
        clean_up(files=app_files, directories=[TMP_DIR])
