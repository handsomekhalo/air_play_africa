"""
General functions and classes are stored here to remove duplicated accross the system.
"""

import json
import requests
from rest_framework import serializers


class BaseFormSerializer(serializers.Serializer):
    """Base form serializer for cleaning incoming and outgoing data"""

    def create(self, validated_data):
        """Override create method to do nothing"""

    def update(self, instance, validated_data):
        """Override create method to do nothing"""


# def host_url(request):
#     """
#     This function is used to get the base url of the application.
#     """
#     protocol = request.scheme
#     host = request.get_host()
#     base_url = f"{protocol}://{host}"
#     return base_url

def host_url(request=None):
    return "http://127.0.0.1:8001"

def api_connection(method, url, headers, data):
    """This function is used to connect to the api."""
    response = requests.request(method, url, headers=headers, data=data, timeout=120)
    # response_data = json.loads(response.json())
    response_data = response.json()

    return response_data


def _send_email_thread(url, headers, payload):
    """This function is used to send email in a thread."""
    requests.post(url=url, headers=headers, data=payload, timeout=120)
