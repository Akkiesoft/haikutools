#!/usr/bin/env python
# coding: utf-8

import os
import time
import datetime
import requests

USER="Akkiesoft"
DOWNLOAD_DIR = "/Users/akkie/Desktop/haiku"

API = "http://h.hatena.ne.jp/api/statuses/user_timeline/" + USER + ".json"
TIMEZONE = 32400
# BODY_FORMATS:
# see http://developer.hatena.ne.jp/ja/documents/haiku/apis/rest/datatypes#body_formats
# I recommend to set "haiku" (for parsing) or "html" (for viewing) or both.
BODY_FORMATS="haiku,html"

def time2unix(t):
  dt = datetime.datetime.strptime(t, '%Y-%m-%dT%H:%M:%SZ')
  return int(time.mktime(dt.timetuple())) + TIMEZONE

reftime = 0
reftime_count = 0
err = 0
while True:
  params = {
    'per_page': 200,
    'reftime': "-" + str(reftime) + "%2C" + str(reftime_count),
    'body_formats': BODY_FORMATS
  }
  r = requests.get(API, params=params)

  # check status_code
  if r.status_code != 200:
    err = err + 1
    print("Error(" + str(err) + "): api respond " + str(r.status_code))
    if 3 <= err:
      print("EXIT.")
      break
    print("Sleep for 10 sec.")
    time.sleep(10)
  err = 0

  json = r.json()

  # save
  path = os.path.join(DOWNLOAD_DIR, USER + '-' + str(time2unix(json[0]['created_at'])) + ".json")
  with open(path, 'wb') as saveFile:
    saveFile.write(r.content)
  print(path)

  if (len(json) == 0):
    print("DONE.")
    break
  reftime = time2unix(json[-1]['created_at'])
  reftime_count = 1

  time.sleep(2)
