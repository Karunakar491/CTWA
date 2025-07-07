@@ .. @@
              <>
                {/* Validation Status Indicator */}
                {validationErrors.length > 0 && (
                  <div className="flex items-center space-x-1 px-2 py-1 bg-red-50 border border-red-200 rounded-md">
                    <AlertTriangle className="h-3 w-3 text-red-600" />
                    <span className="text-xs text-red-700 font-medium">
                      {validationErrors.length} error{validationErrors.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowStaticPreview(true)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Static Preview
                </Button>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowInteractivePreview(true)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Interactive Preview
                </Button>