from django.http import HttpResponse
from django.template import loader

from .models import Project

def index(request):
	template = loader.get_template('miccoliPortfolio/index.html')

	context = {}

	return HttpResponse(template.render(context, request))

def indexTemp(request):
	template = loader.get_template('miccoliPortfolio/index-temp.html')
	
	projects = Project.objects.all()

	context = {
		'projects': projects
	}

	return HttpResponse(template.render(context, request))

def project_detail(request, title):
	template = loader.get_template('miccoliPortfolio/project-page.html')
	project = Project.objects.get(slug=title)
	context = {
		'project': project
	}
	return HttpResponse(template.render(context, request))