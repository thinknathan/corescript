#!/usr/bin/env python3
from http.server import HTTPServer, SimpleHTTPRequestHandler, test
import sys
import os

class HeaderRequestHandler(SimpleHTTPRequestHandler):
	def end_headers (self):
		self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
		self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
		self.send_header('Referrer-Policy', 'no-referrer-when-downgrade')
		self.send_header('X-Content-Type-Options', 'nosniff')
		self.send_header('Content-Security-Policy', "frame-ancestors 'self'")
		SimpleHTTPRequestHandler.end_headers(self)

os.chdir('www')

if __name__ == '__main__':
	test(HeaderRequestHandler, HTTPServer, port=int(sys.argv[1]) if len(sys.argv) > 1 else 8000)
