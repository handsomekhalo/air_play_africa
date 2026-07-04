# User Types
from decimal import Decimal


ADMIN = "Admin"
ARTIST = "Artist"
LISTENER = "Listener"
# system_management/constants.py — add this
MINIMUM_WITHDRAWAL_AMOUNT = 500 # 
MINIMUM_TIP_AMOUNT = 1.00


STREAM_MIN_LISTEN_SECONDS = 30      # minimum listen time to qualify as a real stream
STREAM_ARTIST_RATE = Decimal('0.01')  # ZAR per qualifying stream
# application types
EMPTY = '' 
# API components
JSON_APPLICATION = 'application/json'
INVALID_REQUEST_METHOD = "Invalid request: method not allowed."

#case form  types constants"""
